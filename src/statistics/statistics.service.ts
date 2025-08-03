import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { Schedule, ScheduleDocument } from '../bookings/schemas/schedule.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schema';
import { Visitor, VisitorDocument } from '../visitors/schemas/visitor.schema';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Schedule.name) private scheduleModel: Model<ScheduleDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Visitor.name) private visitorModel: Model<VisitorDocument>,
  ) {}

  async getTotalBookings() {
    return this.scheduleModel.countDocuments();
  }

  async getCompletedBookings() {
    return this.scheduleModel.countDocuments({ status: 'completed' });
  }

  async getPendingBookings() {
    return this.scheduleModel.countDocuments({ status: { $in: ['pending', 'confirmed'] } });
  }

  async getTotalRevenue() {
    const result = await this.paymentModel.aggregate([
      { $match: { status: 'succeeded' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total || 0;
  }

  async getNewCustomers(since: Date) {
    // Count users who made their first successful payment since the given date
    // This gives us actual new paying customers, not just registered users
    const result = await this.paymentModel.aggregate([
      { $match: { status: 'succeeded', paidAt: { $gte: since } } },
      { $group: { _id: '$user', firstPayment: { $min: '$paidAt' } } },
      { $match: { firstPayment: { $gte: since } } },
      { $count: 'total' }
    ]);
    
    return result[0]?.total || 0;
  }

  async getPendingConfirmationBookings(limit = 10) {
    console.log('🔍 [DEBUG] getPendingConfirmationBookings called');
    
    // Get schedules that were paid for but NOT confirmed by admin AND NOT completed
    const schedules = await this.scheduleModel.find({ 
      paymentStatus: 'completed',
      status: { $nin: ['confirmed', 'completed'] }  // Not confirmed and not completed
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate({
      path: 'booking',
      populate: {
        path: 'user',
        select: '-password'
      }
    });

    console.log('🔍 [DEBUG] Found schedules pending confirmation:', schedules.length);
    console.log('🔍 [DEBUG] Sample pending schedule:', schedules[0] ? JSON.stringify(schedules[0], null, 2) : 'No pending schedules found');

    // Transform schedule data to match booking format expected by frontend
    return schedules.map(schedule => ({
      _id: schedule._id,
      serviceType: (schedule.booking as any).serviceType,
      user: (schedule.booking as any).user,
      scheduledDate: schedule.startDate,
      status: schedule.status,
      estimatedPrice: (schedule.booking as any).estimatedPrice
    }));
  }

  async getRecentBookings(limit = 10) {
    console.log('🔍 [DEBUG] getRecentBookings called');
    
    // Get schedules that were paid for recently
    const schedules = await this.scheduleModel.find({ 
      paymentStatus: 'completed' 
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate({
      path: 'booking',
      populate: {
        path: 'user',
        select: '-password'
      }
    });

    console.log('🔍 [DEBUG] Found schedules with paymentStatus completed:', schedules.length);
    console.log('🔍 [DEBUG] Sample schedule:', schedules[0] ? JSON.stringify(schedules[0], null, 2) : 'No schedules found');

    // Transform schedule data to match booking format expected by frontend
    return schedules.map(schedule => ({
      _id: schedule._id,
      serviceType: (schedule.booking as any).serviceType,
      user: (schedule.booking as any).user,
      scheduledDate: schedule.startDate,
      status: schedule.status,
      estimatedPrice: (schedule.booking as any).estimatedPrice
    }));
  }

  async getUpcomingBookings(limit = 10) {
    console.log('🔍 [DEBUG] getUpcomingBookings called');
    const now = new Date();
    
    // Get schedules that were paid for AND confirmed by admin
    const schedules = await this.scheduleModel.find({
      startDate: { $gte: now },
      paymentStatus: 'completed',
      status: 'confirmed'
    })
    .sort({ startDate: 1 })
    .limit(limit)
    .populate({
      path: 'booking',
      populate: {
        path: 'user',
        select: '-password'
      }
    });

    console.log('🔍 [DEBUG] Found upcoming schedules:', schedules.length);
    console.log('🔍 [DEBUG] Sample upcoming schedule:', schedules[0] ? JSON.stringify(schedules[0], null, 2) : 'No upcoming schedules found');

    // Transform schedule data to match booking format expected by frontend
    return schedules.map(schedule => ({
      _id: schedule._id,
      serviceType: (schedule.booking as any).serviceType,
      user: (schedule.booking as any).user,
      scheduledDate: schedule.startDate,
      status: schedule.status,
      estimatedPrice: (schedule.booking as any).estimatedPrice
    }));
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

  async debugPaymentStatuses() {
    console.log('🔍 [DEBUG] Checking payment statuses in database...');
    
    // Check what payment statuses exist in schedules
    const scheduleStatuses = await this.scheduleModel.distinct('paymentStatus');
    console.log('🔍 [DEBUG] Schedule payment statuses:', scheduleStatuses);
    
    // Check what payment statuses exist in bookings
    const bookingStatuses = await this.bookingModel.distinct('paymentStatus');
    console.log('🔍 [DEBUG] Booking payment statuses:', bookingStatuses);
    
    // Count schedules by payment status
    const scheduleCounts = await this.scheduleModel.aggregate([
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
    ]);
    console.log('🔍 [DEBUG] Schedule counts by payment status:', scheduleCounts);
    
    return { scheduleStatuses, bookingStatuses, scheduleCounts };
  }

  async getDailyVisitors() {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6); // Get last 7 days including today

    // Create a map of all 7 days with default value 0
    const dailyData = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(sevenDaysAgo);
      date.setDate(sevenDaysAgo.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = 0;
    }

    // Get unique sessions for each day using the same logic as visitor stats
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(sevenDaysAgo);
      currentDate.setDate(sevenDaysAgo.getDate() + i);
      
      const startOfDay = new Date(currentDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(currentDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Count distinct sessionIds for this day
      const sessionIds = await this.visitorModel.distinct('sessionId', {
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      dailyData[dateStr] = sessionIds.length;
    }

    // Convert to array format with day names
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const chartData = Object.keys(dailyData).map((dateStr, index) => {
      const date = new Date(dateStr);
      return {
        day: dayNames[date.getDay()],
        visits: dailyData[dateStr]
      };
    });

    return chartData;
  }
} 