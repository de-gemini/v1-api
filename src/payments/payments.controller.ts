import { Controller, Post, Body, Headers, Req, UseGuards, RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StripeService } from './services/stripe.service';
import { BookingsService } from '../bookings/bookings.service';
import { MailService } from '../mail/mail.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import Stripe from 'stripe';
import { Request } from 'express';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly bookingsService: BookingsService,
    private readonly mailService: MailService,
  ) {}

  @Post('create-payment-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a payment intent for a booking' })
  async createPaymentIntent(
    @Body() body: { bookingId: string },
    @Req() req: any,
  ) {
    const booking = await this.bookingsService.findOne(req.user.id, body.bookingId);
    
    const paymentIntent = await this.stripeService.createPaymentIntent(
      booking.estimatedPrice,
    );

    return {
      clientSecret: paymentIntent.client_secret,
    };
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  async handleWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!request.rawBody) {
      throw new Error('No raw body available');
    }

    const event = await this.stripeService.constructEventFromWebhook(
      request.rawBody,
      signature,
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        // Update booking status and send confirmation email
        if (paymentIntent.metadata?.bookingId) {
          const booking = await this.bookingsService.findOne(
            paymentIntent.metadata.userId,
            paymentIntent.metadata.bookingId,
          );
          
          await this.bookingsService.updateStatus(
            paymentIntent.metadata.bookingId,
            'confirmed',
          );

          await this.mailService.sendBookingConfirmation(
            booking.user,
            booking,
          );
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        if (failedPayment.metadata?.bookingId) {
          await this.bookingsService.updateStatus(
            failedPayment.metadata.bookingId,
            'payment_failed',
          );

          const booking = await this.bookingsService.findOne(
            failedPayment.metadata.userId,
            failedPayment.metadata.bookingId,
          );

          await this.mailService.sendPaymentFailedNotification(
            booking.user,
            booking,
          );
        }
        break;
    }

    return { received: true };
  }
} 