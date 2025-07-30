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
import { SystemSettingsService } from '../system-settings/system-settings.service';


@Injectable()
export class BookingsService extends BaseRepository<BookingDocument> {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Schedule.name) private scheduleModel: Model<ScheduleDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
    private readonly pricingStore: PricingStoreService,
    private readonly systemSettingsService: SystemSettingsService,
  ) {
    super(bookingModel);
  }

  async createBooking(userId: string, bookingData: Partial<Booking> & { subscriptionMonths?: number }): Promise<Booking> {
    // Check if booking prevention is enabled
    const isBookingPreventionEnabled = await this.systemSettingsService.isBookingPreventionEnabled();
    if (isBookingPreventionEnabled) {
      const settings = await this.systemSettingsService.getSettings();
      const preventionSettings = settings.settings.bookingPrevention;
      
      // Check if current date is within prevention period
      const now = new Date();
      const startDate = preventionSettings.startDate ? new Date(preventionSettings.startDate) : null;
      const endDate = preventionSettings.endDate ? new Date(preventionSettings.endDate) : null;
      
      if ((!startDate || now >= startDate) && (!endDate || now <= endDate)) {
        throw new BadRequestException(
          preventionSettings.reason || 'Booking is currently disabled. Please try again later.'
        );
      }
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Use the frontend price directly without recalculation
    const { subscriptionMonths = 1, ...rest } = bookingData;
    const booking = await super.create({
      ...rest,
      user: user, // Pass the full user object, not just user._id
      status: 'pending',
      subscriptionMonths,
      schedulesCount: 1, // Will update after schedule creation
      serverPrice: bookingData.estimatedPrice, // Use frontend price as server price
      clientPrice: bookingData.estimatedPrice, // Use frontend price as client price
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
      // Use the scheduledDateTime or scheduledDate from the booking if provided
      let start: Date;
      if (booking.scheduledDateTime) {
        start = new Date(booking.scheduledDateTime);
      } else if (booking.scheduledDate) {
        start = new Date(booking.scheduledDate);
      } else {
        start = new Date(now);
        const time = booking.scheduledTime || '09:00';
        const [hours, minutes] = time.split(':').map(Number);
        start.setHours(hours, minutes, 0, 0);
      }
      const time = booking.scheduledTime || '09:00';
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
    console.log('🔍 [DEBUG] findOneByUser called with userId:', userId, 'bookingId:', bookingId);
    
    const booking = await this.bookingModel
      .findOne({ _id: bookingId, user: userId })
      .populate('user', '-password')
      .exec();

    console.log('🔍 [DEBUG] Booking found:', booking ? 'YES' : 'NO');
    
    if (!booking) {
      console.log('🔍 [DEBUG] Throwing NotFoundException');
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

    // await this.mailService.sendBookingStatusUpdate(booking.user as User, booking);
    return booking;
  }

  async updateScheduleStatus(scheduleId: string, status: string): Promise<any> {
    const schedule = await this.scheduleModel
      .findByIdAndUpdate(scheduleId, { status }, { new: true })
      .populate({
        path: 'booking',
        populate: { path: 'user', select: '-password' }
      })
      .exec();

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    return schedule;
  }

  async updateSchedulePaymentStatus(scheduleId: string, paymentStatus: string): Promise<any> {
    const schedule = await this.scheduleModel
      .findByIdAndUpdate(scheduleId, { paymentStatus }, { new: true })
      .populate({
        path: 'booking',
        populate: { path: 'user', select: '-password' }
      })
      .exec();

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    return schedule;
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
  // Note: These methods are for internal use only - booking status is never sent to frontend
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

  async getUserSchedules(userId: string) {
    return this.scheduleModel
      .find()
      .populate({
        path: 'booking',
        match: { user: userId },
        populate: { path: 'user', select: '-password' }
      })
      .exec()
      .then(schedules => schedules.filter(schedule => schedule.booking)); // Only return schedules with valid bookings
  }

  async getScheduleById(scheduleId: string) {
    console.log('🔍 [DEBUG] getScheduleById called with scheduleId:', scheduleId);
    
    const schedule = await this.scheduleModel
      .findById(scheduleId)
      .populate({
        path: 'booking',
        populate: { path: 'user', select: '-password' }
      })
      .exec();

    console.log('🔍 [DEBUG] Schedule found:', schedule ? 'YES' : 'NO');

    if (!schedule) {
      console.log('🔍 [DEBUG] Throwing NotFoundException for schedule');
      throw new NotFoundException('Schedule not found');
    }

    return schedule;
  }

  // async getUserScheduleStats(userId: string, filter?: { year: string, month: string }) {
  //   let query = this.scheduleModel.find();
    
  //   // Filter by user
  //   query = query.populate({
  //     path: 'booking',
  //     match: { user: userId },
  //     populate: { path: 'user', select: '-password' }
  //   });

  //   // Apply date filter if provided
  //   if (filter && filter.year && filter.month) {
  //     const year = parseInt(filter.year, 10);
  //     const month = parseInt(filter.month, 10) - 1; // JS months are 0-based
  //     const start = Date.UTC(year, month, 1);
  //     const end = Date.UTC(year, month + 1, 1);
  //     query = query.where('startDate').gte(start).lt(end);
  //   }

  //   const schedules = await query.exec();
  //   const userSchedules = schedules.filter(schedule => schedule.booking);

  //   const stats = {
  //     total: userSchedules.length,
  //     pending: userSchedules.filter(s => s.status === 'pending').length,
  //     confirmed: userSchedules.filter(s => s.status === 'confirmed').length,
  //     completed: userSchedules.filter(s => s.status === 'completed').length,
  //     cancelled: userSchedules.filter(s => s.status === 'cancelled').length,
  //     monthlyBreakdown: []
  //   };

  //   // Calculate monthly breakdown for the current year
  //   const currentYear = new Date().getFullYear();
  //   for (let month = 0; month < 12; month++) {
  //     const monthStart = Date.UTC(currentYear, month, 1);
  //     const monthEnd = Date.UTC(currentYear, month + 1, 1);
  //     const monthSchedules = userSchedules.filter(s => {
  //       const scheduleDate = new Date(s.startDate);
  //       return scheduleDate >= monthStart && scheduleDate < monthEnd;
  //     });

  //     stats.monthlyBreakdown.push({
  //       month: month + 1,
  //       total: monthSchedules.length,
  //       pending: monthSchedules.filter(s => s.status === 'pending').length,
  //       confirmed: monthSchedules.filter(s => s.status === 'confirmed').length,
  //       completed: monthSchedules.filter(s => s.status === 'completed').length,
  //       cancelled: monthSchedules.filter(s => s.status === 'cancelled').length,
  //     });
  //   }

  //   return stats;
  // }

  async updatePaymentMethod(bookingId: string, paymentMethod: 'card' | 'cash', userId: string): Promise<Booking> {
    const booking = await this.bookingModel
      .findOneAndUpdate(
        { _id: bookingId, user: userId },
        { 
          paymentMethod,
          ...(paymentMethod === 'cash' && { paymentStatus: 'pending' })
        },
        { new: true }
      )
      .populate('user', '-password')
      .exec();

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }


} 