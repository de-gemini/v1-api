import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from '../users/schemas/user.schema';
import { Booking } from '../bookings/schemas/booking.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Schedule, ScheduleDocument } from '../bookings/schemas/schedule.schema';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    @InjectModel(Schedule.name) private scheduleModel: Model<ScheduleDocument>,
  ) {}

  async sendBookingConfirmation(user: User, booking: Booking) {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Booking Confirmation - Gemini Cleaning Services',
      template: 'booking-confirmation',
      context: {
        name: user.name,
        serviceType: booking.serviceType,
        scheduledDate: booking.scheduledDate,
        address: booking.address,
        price: booking.estimatedPrice,
      },
    });
  }

  async sendTestEmail(to: string, name: string) {
    await this.mailerService.sendMail({
      to: to,
      subject: 'Test Email - Gemini Cleaning Services',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4CAF50;">Test Email Success!</h2>
          <p>Hello ${name},</p>
          <p>This is a test email to verify that your email configuration is working correctly.</p>
          <p><strong>Email Details:</strong></p>
          <ul>
            <li>Sent to: ${to}</li>
            <li>Sent at: ${new Date().toLocaleString()}</li>
            <li>Service: Gemini Cleaning Services</li>
          </ul>
          <p>If you received this email, your email configuration is working properly!</p>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated test email from Gemini Cleaning Services.</p>
        </div>
      `,
    });
  }

  async sendBookingStatusUpdate(user: User, booking: Booking) {
    // Get the primary schedule for this booking to get the current status
    const primarySchedule = await this.scheduleModel
      .findOne({ booking: booking._id })
      .sort({ startDate: 1 })
      .exec();

    const status = primarySchedule?.status || 'pending';

    await this.mailerService.sendMail({
      to: user.email,
      subject: `Schedule Status Update - ${status}`,
      template: './booking-status-update',
      context: {
        name: user.name,
        serviceType: booking.serviceType,
        scheduledDate: booking.scheduledDate,
        status: status,
      },
    });
  }

  async sendPaymentFailedNotification(user: User, booking: Booking) {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Payment Failed - Action Required',
      template: './payment-failed',
      context: {
        name: user.name,
        serviceType: booking.serviceType,
        scheduledDate: booking.scheduledDate,
        price: booking.estimatedPrice,
        bookingId: booking._id,
      },
    });
  }

  async sendWelcomeEmail(user: User) {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Welcome to Gemini Cleaning Services',
      template: './welcome',
      context: {
        name: user.name,
      },
    });
  }
} 