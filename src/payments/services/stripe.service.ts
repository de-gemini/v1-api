import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import Stripe from 'stripe';
import { STRIPE_CONFIG, StripeConfig } from '../stripe.config';
import { BookingsService } from '../../bookings/bookings.service';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private webhookSecret?: string;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    @Inject(STRIPE_CONFIG) config: StripeConfig,
    @Inject(forwardRef(() => BookingsService)) private readonly bookingsService: BookingsService,
    @Inject(forwardRef(() => MailService)) private readonly mailService: MailService,
  ) {
    if (!config.apiKey) {
      throw new Error('Stripe API key is required');
    }
    this.stripe = new Stripe(config.apiKey, {
      apiVersion: (config.apiVersion as '2025-05-28.basil') || '2025-05-28.basil',
    });
    this.webhookSecret = config.webhookSecret;
  }

  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    metadata?: Record<string, string>;
    description?: string;
  }) {
    return await this.stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100), // Convert to cents
      currency: params.currency,
      metadata: params.metadata,
      description: params.description,
    });
  }

  async retrievePaymentIntent(paymentIntentId: string) {
    return await this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async capturePayment(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.capture(paymentIntentId);
  }

  async createCustomer(email: string, name: string): Promise<Stripe.Customer> {
    return this.stripe.customers.create({
      email,
      name,
    });
  }

  async attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    return this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
  }

  async refundPayment(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      refundParams.amount = Math.round(amount * 100);
    }

    return this.stripe.refunds.create(refundParams);
  }

  async constructEventFromWebhook(
    payload: string | Buffer,
    signature: string,
  ): Promise<Stripe.Event> {
    if (!this.webhookSecret) {
      throw new Error('Stripe webhook secret is not configured');
    }
    return this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
  }

  async handleWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata?.bookingId;
        const userId = paymentIntent.metadata?.userId;
        if (!bookingId) {
          this.logger.error('No bookingId in paymentIntent metadata');
          return;
        }
        this.logger.log(`Payment succeeded for bookingId: ${bookingId}, userId: ${userId}`);
        const booking = await this.bookingsService.findById(bookingId);
        if (booking) {
          await this.bookingsService.updatePaymentStatus(bookingId, 'completed');
          // await this.mailService.sendBookingConfirmation(booking.user, booking);
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        const bookingId = failedPayment.metadata?.bookingId;
        const userId = failedPayment.metadata?.userId;
        if (!bookingId) {
          this.logger.error('No bookingId in paymentIntent metadata');
          return;
        }
        this.logger.log(`Payment failed for bookingId: ${bookingId}, userId: ${userId}`);
        const failedBooking = await this.bookingsService.findById(bookingId);
        if (failedBooking) {
          await this.bookingsService.updatePaymentStatus(bookingId, 'failed');
          // await this.mailService.sendPaymentFailedNotification(failedBooking.user, failedBooking);
        }
        break;
      }
    }
  }
} 