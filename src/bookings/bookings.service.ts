import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { BaseRepository } from '../common/repositories/base.repository';
import { Booking, BookingDocument, CleaningFrequency } from './schemas/booking.schema';
import { Schedule, ScheduleDocument, ScheduleFrequency } from './schemas/schedule.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { PricingStoreService } from '../common/pricing/pricingStore';


@Injectable()
export class BookingsService extends BaseRepository<BookingDocument> {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Schedule.name) private scheduleModel: Model<ScheduleDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
    private readonly pricingStore: PricingStoreService,
  ) {
    super(bookingModel);
  }

  async createBooking(userId: string, bookingData: Partial<Booking> & { subscriptionMonths?: number }): Promise<Booking> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate and recalculate price for security
    let serverPrice: number | undefined = undefined;
    let clientPrice: number | undefined = undefined;
    if (bookingData.estimatedPrice !== undefined) {
      clientPrice = bookingData.estimatedPrice;
      const recalculatedPrice = this.pricingStore.calculateEstimatedPrice(bookingData as any);
      serverPrice = recalculatedPrice;
      // Compare prices with small tolerance for floating point differences
      if (Math.abs(serverPrice - clientPrice) > 0.01) {
        // Optionally log or handle price mismatch here
      }
      // Use the recalculated price for security
      bookingData.estimatedPrice = serverPrice;
    }

    const { subscriptionMonths = 1, ...rest } = bookingData;
    const booking = await super.create({
      ...rest,
      user: user, // Pass the full user object, not just user._id
      status: 'pending',
      subscriptionMonths,
      schedulesCount: 1, // Will update after schedule creation
      serverPrice,
      clientPrice,
    });
    const schedulesCreated = await this.createSchedulesForBooking(booking, subscriptionMonths);
    // Update booking with actual schedulesCount
    await this.bookingModel.findByIdAndUpdate(booking._id, {
      schedulesCount: schedulesCreated,
      subscriptionMonths,
    });
    // await this.mailService.sendBookingConfirmation(user, booking);
    return booking;
  }

  private async createSchedulesForBooking(booking: Booking, subscriptionMonths: number): Promise<number> {
    const freq = booking.frequency as CleaningFrequency;
    const schedules: Partial<Schedule>[] = [];
    const now = new Date();
    // Use subscriptionMonths or default to 1
    const months = subscriptionMonths > 0 ? subscriptionMonths : 1;

    if (freq === CleaningFrequency.ONETIME) {
      // Onetime: create a single schedule for today at the specified time
      const time = booking.scheduledTime || '09:00';
      const [hours, minutes] = time.split(':').map(Number);
      const start = new Date(now);
      start.setHours(hours, minutes, 0, 0);
      schedules.push({
        booking: booking._id as any,
        frequency: ScheduleFrequency.ONETIME,
        startDate: start,
        time,
      });
    } else if (freq === CleaningFrequency.WEEKLY || freq === CleaningFrequency.FORTNIGHT) {
      // Weekly/Fortnight: generate N schedules from today
      const dayOfWeek = booking.scheduledDayOfWeek;
      const time = booking.scheduledTime || '09:00';
      if (typeof dayOfWeek !== 'number' || !time) return 0;
      let current = new Date(now);
      // Set to the next occurrence of the desired dayOfWeek
      while (current.getDay() !== dayOfWeek) {
        current.setDate(current.getDate() + 1);
      }
      const [hours, minutes] = time.split(':').map(Number);
      current.setHours(hours, minutes, 0, 0);
      let totalOccurrences = 0;
      if (freq === CleaningFrequency.WEEKLY) {
        totalOccurrences = months * 4; // 4 weeks per month
      } else if (freq === CleaningFrequency.FORTNIGHT) {
        totalOccurrences = months * 2; // 2 fortnights per month
      }
      for (let i = 0; i < totalOccurrences; i++) {
        schedules.push({
          booking: booking._id as any,
          frequency: freq as unknown as ScheduleFrequency,
          startDate: new Date(current),
          dayOfWeek,
          time,
        });
        current.setDate(current.getDate() + 7 * (freq === CleaningFrequency.WEEKLY ? 1 : 2));
      }
    } else if (freq === CleaningFrequency.MONTHLY) {
      // Monthly: generate N schedules from today
      const dayOfMonth = booking.scheduledDayOfMonth;
      const time = booking.scheduledTime || '09:00';
      if (typeof dayOfMonth !== 'number' || !time) return 0;
      let current = new Date(now);
      // Set to the next occurrence of the desired dayOfMonth
      if (current.getDate() > dayOfMonth) {
        current.setMonth(current.getMonth() + 1);
      }
      current.setDate(dayOfMonth);
      const [hours, minutes] = time.split(':').map(Number);
      current.setHours(hours, minutes, 0, 0);
      for (let i = 0; i < months; i++) {
        schedules.push({
          booking: booking._id as any,
          frequency: ScheduleFrequency.MONTHLY,
          startDate: new Date(current),
          dayOfMonth,
          time,
        });
        current.setMonth(current.getMonth() + 1);
      }
    }
    if (schedules.length) {
      await this.scheduleModel.insertMany(schedules);
    }
    return schedules.length;
  }

  async findAll(userId: string): Promise<Booking[]> {
    return await this.bookingModel
      .find({ user: userId })
      .populate('user', '-password')
      .exec();
  }

  async findOneByUser(userId: string, bookingId: string): Promise<Booking> {
    const booking = await this.bookingModel
      .findOne({ _id: bookingId, user: userId })
      .populate('user', '-password')
      .exec();

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async findById(bookingId: string): Promise<BookingDocument | null> {
    return await this.bookingModel
      .findById(bookingId)
      .populate('user', '-password')
      .exec();
  }

  async updateStatus(bookingId: string, status: string): Promise<Booking> {
    const booking = await this.bookingModel
      .findByIdAndUpdate(bookingId, { status }, { new: true })
      .populate('user', '-password')
      .exec();

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    await this.mailService.sendBookingStatusUpdate(booking.user as User, booking);
    return booking;
  }

  async delete(userId: string, bookingId: string): Promise<void> {
    const booking = await this.bookingModel
      .findOneAndDelete({ _id: bookingId, user: userId })
      .exec();

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
  }

  // Additional methods using the base repository
  async findByStatus(status: string): Promise<Booking[]> {
    return await this.bookingModel
      .find({ status })
      .populate('user', '-password')
      .exec();
  }

  async findByPaymentStatus(paymentStatus: string): Promise<Booking[]> {
    return await this.bookingModel
      .find({ paymentStatus })
      .populate('user', '-password')
      .exec();
  }

  async updatePaymentStatus(bookingId: string, paymentStatus: string): Promise<Booking> {
    const booking = await this.bookingModel
      .findByIdAndUpdate(bookingId, { paymentStatus }, { new: true })
      .populate('user', '-password')
      .exec();

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async getAllSchedulesWithDetails(filter?: { year: string, month: string }) {
    let query = this.scheduleModel.find();
    if (filter && filter.year && filter.month) {
      const year = parseInt(filter.year, 10);
      const month = parseInt(filter.month, 10) - 1; // JS months are 0-based
      const start = Date.UTC(year, month, 1);
      const end = Date.UTC(year, month + 1, 1);
      query = query.where('startDate').gte(start).lt(end);
    }
    return query
      .populate({
        path: 'booking',
        populate: { path: 'user', select: '-password' }
      })
      .exec();
  }
} 