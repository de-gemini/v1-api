import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Schedule, ScheduleDocument } from '../bookings/schemas/schedule.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schema';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Schedule.name) private scheduleModel: Model<ScheduleDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
  ) {}

  async getTotalBookings() {
    return this.bookingModel.countDocuments();
  }

  async getCompletedBookings() {
    return this.bookingModel.countDocuments({ status: 'completed' });
  }

  async getPendingBookings() {
    return this.bookingModel.countDocuments({ status: { $in: ['pending', 'confirmed'] } });
  }

  async getTotalRevenue() {
    const result = await this.paymentModel.aggregate([
      { $match: { status: 'succeeded' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total || 0;
  }

  async getNewCustomers(since: Date) {
    return this.userModel.countDocuments({ createdAt: { $gte: since } });
  }

  async getRecentBookings(limit = 10) {
    return this.bookingModel.find().sort({ createdAt: -1 }).limit(limit).populate('user', '-password');
  }

  async getTopCustomers(limit = 5) {
    const result = await this.bookingModel.aggregate([
      { $group: { _id: '$user', bookings: { $sum: 1 }, totalSpend: { $sum: '$actualPrice' } } },
      { $sort: { bookings: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          bookings: 1,
          totalSpend: 1,
          name: '$user.name',
          email: '$user.email',
        },
      },
    ]);
    return result;
  }

  async getTopServices(limit = 5) {
    const result = await this.bookingModel.aggregate([
      { $group: { _id: '$serviceType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);
    return result;
  }
} 