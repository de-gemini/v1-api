import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from '../users/schemas/user.schema';
import { Booking } from '../bookings/schemas/booking.schema';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendBookingConfirmation(user: User, booking: Booking) {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Booking Confirmation - Gemini Cleaning Services',
      template: './booking-confirmation',
      context: {
        name: user.name,
        serviceType: booking.serviceType,
        scheduledDate: booking.scheduledDate,
        address: booking.address,
        price: booking.estimatedPrice,
      },
    });
  }

  async sendBookingStatusUpdate(user: User, booking: Booking) {
    await this.mailerService.sendMail({
      to: user.email,
      subject: `Booking Status Update - ${booking.status}`,
      template: './booking-status-update',
      context: {
        name: user.name,
        serviceType: booking.serviceType,
        scheduledDate: booking.scheduledDate,
        status: booking.status,
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