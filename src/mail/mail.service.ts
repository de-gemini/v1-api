import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from '../users/schemas/user.schema';
import { Booking } from '../bookings/schemas/booking.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Schedule, ScheduleDocument } from '../bookings/schemas/schedule.schema';
import { ADMIN_EMAILS, getValidAdminEmails } from '../common/constants/admin-emails';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

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

  async notifyAdminsOfNewBooking(user: User, booking: Booking) {
    const recipients = getValidAdminEmails();
    if (recipients.length === 0) {
      this.logger.warn('No valid admin emails configured, skipping admin notification');
      return;
    }

    const subject = `New Booking Created - ${user.name} - ${booking.serviceType}`;

    await this.mailerService.sendMail({
      to: recipients[0],
      bcc: recipients.slice(1),
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 16px;">
          <h2>New Booking Notification</h2>
          <p>A new booking has been created.</p>
          <h3>Customer</h3>
          <ul>
            <li>Name: ${user.name}</li>
            <li>Email: ${user.email}</li>
          </ul>
          <h3>Booking Details</h3>
          <ul>
            <li>Service: ${booking.serviceType}</li>
            <li>Scheduled Date: ${new Date(booking.scheduledDate).toLocaleString()}</li>
            <li>Address: ${booking.address}</li>
            <li>Estimated Price: £${booking.estimatedPrice}</li>
            <li>Frequency: ${booking.frequency}</li>
          </ul>
          <p>Booking ID: ${booking._id}</p>
        </div>
      `,
    });
  }

  async sendTestEmail(to: string, name: string) {
    this.logger.log(`📧 Starting test email send to: ${to}`);
    this.logger.log(`👤 Recipient name: ${name}`);
    this.logger.log(`⏰ Timestamp: ${new Date().toISOString()}`);

    try {
      this.logger.log('🔧 Preparing email configuration...');
      
      const mailOptions = {
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
      };

      this.logger.log('📤 Attempting to send email...');
      this.logger.log(`📋 Mail options: ${JSON.stringify(mailOptions, null, 2)}`);
      
      const result = await this.mailerService.sendMail(mailOptions);
      
      this.logger.log('✅ Email sent successfully!');
      this.logger.log(`📨 Message ID: ${result.messageId}`);
      this.logger.log(`📧 Response: ${JSON.stringify(result, null, 2)}`);
      
      return result;
    } catch (error) {
      this.logger.error('❌ Failed to send test email');
      this.logger.error(`🚨 Error type: ${error.constructor.name}`);
      this.logger.error(`🚨 Error message: ${error.message}`);
      this.logger.error(`🚨 Error stack: ${error.stack}`);
      
      // Log additional error details
      if (error.code) {
        this.logger.error(`🚨 Error code: ${error.code}`);
      }
      if (error.command) {
        this.logger.error(`🚨 Failed command: ${error.command}`);
      }
      if (error.responseCode) {
        this.logger.error(`🚨 Response code: ${error.responseCode}`);
      }
      if (error.response) {
        this.logger.error(`🚨 Response: ${error.response}`);
      }
      
      throw error;
    }
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