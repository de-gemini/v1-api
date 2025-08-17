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
    // Use the most appropriate date field
    const scheduledDate = booking.scheduledDateTime || booking.scheduledDate;
    const formattedDate = scheduledDate ? new Date(scheduledDate).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'To be scheduled';

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Booking Confirmation - Payment Required - Gemini Cleaning Services',
      template: 'booking-confirmation',
      context: {
        name: user.name,
        serviceType: booking.serviceType,
        scheduledDate: formattedDate,
        address: booking.address,
        price: booking.estimatedPrice,
        dashboardUrl: `${process.env.FRONTEND_URL || 'https://degeminiservices.co.uk'}/dashboard`,
      },
    });
  }

  async sendPaymentConfirmation(user: User, booking: Booking, amount: number, paymentMethod: string) {
    // Use the most appropriate date field
    const scheduledDate = booking.scheduledDateTime || booking.scheduledDate;
    const formattedDate = scheduledDate ? new Date(scheduledDate).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'To be scheduled';

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Payment Confirmation - Booking Confirmed - Gemini Cleaning Services',
      template: 'payment-confirmation',
      context: {
        name: user.name,
        serviceType: booking.serviceType,
        scheduledDate: formattedDate,
        address: booking.address,
        amount: amount,
        paymentMethod: paymentMethod,
      },
    });
  }

  async notifyAdminsOfPaymentSuccess(user: User, booking: Booking, amount: number) {
    const recipients = getValidAdminEmails();
    if (recipients.length === 0) {
      this.logger.warn('No valid admin emails configured, skipping admin notification');
      return;
    }

    const subject = `Payment Successful - ${user.name} - ${booking.serviceType}`;

    // Use the most appropriate date field
    const scheduledDate = booking.scheduledDateTime || booking.scheduledDate;
    const formattedDate = scheduledDate ? new Date(scheduledDate).toLocaleString('en-GB') : 'To be scheduled';

    await this.mailerService.sendMail({
      to: recipients[0],
      bcc: recipients.slice(1),
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 16px;">
          <h2>Payment Successful Notification</h2>
          <p>A payment has been successfully processed for an existing booking.</p>
          <h3>Customer</h3>
          <ul>
            <li>Name: ${user.name}</li>
            <li>Email: ${user.email}</li>
          </ul>
          <h3>Booking Details</h3>
          <ul>
            <li>Service: ${booking.serviceType}</li>
            <li>Scheduled Date: ${formattedDate}</li>
            <li>Address: ${booking.address}</li>
            <li>Amount Paid: £${amount}</li>
            <li>Frequency: ${booking.frequency}</li>
          </ul>
          <p>Booking ID: ${booking._id}</p>
          <p><strong>Status: Payment completed - Booking now confirmed</strong></p>
        </div>
      `,
    });
  }

  async notifyAdminsOfNewBooking(user: User, booking: Booking) {
    const recipients = getValidAdminEmails();
    if (recipients.length === 0) {
      this.logger.warn('No valid admin emails configured, skipping admin notification');
      return;
    }

    const subject = `New Booking Created - ${user.name} - ${booking.serviceType}`;

    // Use the most appropriate date field
    const scheduledDate = booking.scheduledDateTime || booking.scheduledDate;
    const formattedDate = scheduledDate ? new Date(scheduledDate).toLocaleString('en-GB') : 'To be scheduled';

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
            <li>Scheduled Date: ${formattedDate}</li>
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

  async sendBookingStatusUpdate(user: User, booking: Booking, status?: string) {
    // Use provided status or get from primary schedule
    let finalStatus = status;
    if (!finalStatus) {
      const primarySchedule = await this.scheduleModel
        .findOne({ booking: booking._id })
        .sort({ startDate: 1 })
        .exec();
      finalStatus = primarySchedule?.status || 'pending';
    }

    // Determine subject based on status
    let subject = 'Schedule Status Update';
    switch (finalStatus) {
      case 'confirmed':
        subject = 'Booking Confirmed - Your Cleaning Service is Scheduled';
        break;
      case 'completed':
        subject = 'Service Completed - Thank You for Choosing Gemini Cleaning';
        break;
      case 'cancelled':
        subject = 'Booking Cancelled - Gemini Cleaning Services';
        break;
      default:
        subject = `Schedule Status Update - ${finalStatus}`;
    }

    // Use the most appropriate date field
    const scheduledDate = booking.scheduledDateTime || booking.scheduledDate;
    const formattedDate = scheduledDate ? new Date(scheduledDate).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'To be scheduled';

    await this.mailerService.sendMail({
      to: user.email,
      subject,
      template: './booking-status-update',
      context: {
        name: user.name,
        serviceType: booking.serviceType,
        scheduledDate: formattedDate,
        status: finalStatus,
        address: booking.address,
        price: booking.estimatedPrice,
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

  async sendCashPaymentNotification(user: User, booking: Booking) {
    // Use the most appropriate date field
    const scheduledDate = booking.scheduledDateTime || booking.scheduledDate;
    const formattedDate = scheduledDate ? new Date(scheduledDate).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'To be scheduled';

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Cash Payment Selected - Gemini Cleaning Services',
      template: 'cash-payment-selected',
      context: {
        name: user.name,
        serviceType: booking.serviceType,
        scheduledDate: formattedDate,
        address: booking.address,
        price: booking.estimatedPrice,
        dashboardUrl: `${process.env.FRONTEND_URL || 'https://degeminiservices.co.uk'}/dashboard`,
      },
    });
  }

  async notifyAdminsOfCashPayment(user: User, booking: Booking) {
    const recipients = getValidAdminEmails();
    if (recipients.length === 0) {
      this.logger.warn('No valid admin emails configured, skipping admin notification');
      return;
    }

    const subject = `Cash Payment Selected - ${user.name} - ${booking.serviceType}`;

    // Use the most appropriate date field
    const scheduledDate = booking.scheduledDateTime || booking.scheduledDate;
    const formattedDate = scheduledDate ? new Date(scheduledDate).toLocaleString('en-GB') : 'To be scheduled';

    await this.mailerService.sendMail({
      to: recipients[0],
      bcc: recipients.slice(1),
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 16px;">
          <h2>Cash Payment Notification</h2>
          <p>A customer has selected cash payment for their booking.</p>
          <h3>Customer</h3>
          <ul>
            <li>Name: ${user.name}</li>
            <li>Email: ${user.email}</li>
          </ul>
          <h3>Booking Details</h3>
          <ul>
            <li>Service: ${booking.serviceType}</li>
            <li>Scheduled Date: ${formattedDate}</li>
            <li>Address: ${booking.address}</li>
            <li>Estimated Price: £${booking.estimatedPrice}</li>
            <li>Frequency: ${booking.frequency}</li>
          </ul>
          <p>Booking ID: ${booking._id}</p>
          <p><strong>Status: Cash payment selected - Payment pending</strong></p>
          <p><em>Note: Customer will pay in cash on the day of service.</em></p>
        </div>
      `,
    });
  }

  async notifyAdminsOfStatusChange(user: User, booking: Booking, status: string) {
    const recipients = getValidAdminEmails();
    if (recipients.length === 0) {
      this.logger.warn('No valid admin emails configured, skipping admin notification');
      return;
    }

    const subject = `Booking Status Changed - ${status} - ${user.name} - ${booking.serviceType}`;

    // Use the most appropriate date field
    const scheduledDate = booking.scheduledDateTime || booking.scheduledDate;
    const formattedDate = scheduledDate ? new Date(scheduledDate).toLocaleString('en-GB') : 'To be scheduled';

    await this.mailerService.sendMail({
      to: recipients[0],
      bcc: recipients.slice(1),
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 16px;">
          <h2>Booking Status Change Notification</h2>
          <p>A booking status has been updated.</p>
          <h3>Customer</h3>
          <ul>
            <li>Name: ${user.name}</li>
            <li>Email: ${user.email}</li>
          </ul>
          <h3>Booking Details</h3>
          <ul>
            <li>Service Type: ${booking.serviceType}</li>
            <li>Scheduled Date: ${formattedDate}</li>
            <li>Address: ${booking.address}</li>
            <li>Price: £${booking.estimatedPrice}</li>
            <li>New Status: <strong>${status}</strong></li>
          </ul>
        </div>
      `,
    });
  }

  async sendOtpEmail(user: User, otp: string) {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Password Reset OTP - Gemini Cleaning Services',
      template: './otp-email',
      context: {
        name: user.name,
        otp: otp,
      },
    });
  }
} 