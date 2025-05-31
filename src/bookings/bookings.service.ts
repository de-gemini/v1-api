import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { MailService } from '../mail/mail.service';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly mailService: MailService,
  ) {}

  async create(userId: string, bookingData: Partial<Booking>): Promise<Booking> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const booking = new this.bookingModel({
      ...bookingData,
      user: userId,
      status: 'pending',
    });

    const savedBooking = await booking.save();
    await this.mailService.sendBookingConfirmation(user, savedBooking);
    
    return savedBooking;
  }

  async findAll(userId: string): Promise<Booking[]> {
    return this.bookingModel
      .find({ user: userId })
      .populate('user', '-password')
      .exec();
  }

  async findOne(userId: string, bookingId: string): Promise<Booking> {
    const booking = await this.bookingModel
      .findOne({ _id: bookingId, user: userId })
      .populate('user', '-password')
      .exec();

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async updateStatus(bookingId: string, status: string): Promise<Booking> {
    const booking = await this.bookingModel
      .findByIdAndUpdate(
        bookingId,
        { status },
        { new: true }
      )
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
} 