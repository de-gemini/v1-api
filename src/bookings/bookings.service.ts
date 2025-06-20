import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../common/repositories/base.repository';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class BookingsService extends BaseRepository<BookingDocument> {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
  ) {
    super(bookingModel);
  }

  async createBooking(userId: string, bookingData: Partial<Booking>): Promise<Booking> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const booking = await super.create({
      ...bookingData,
      user: user,
      status: 'pending',
    });

    // await this.mailService.sendBookingConfirmation(user, booking);
    
    return booking;
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
} 