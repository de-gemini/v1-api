/**
 * ⚠️  CRITICAL PAYMENT SERVICE - DO NOT EDIT WITHOUT EXPLICIT PERMISSION ⚠️
 * 
 * This file contains the core Stripe payment processing logic including:
 * - Payment intent creation and management
 * - Webhook event handling
 * - Subscription management
 * - Payment status updates
 * 
 * CRITICAL WARNING:
 * - This code directly handles financial transactions
 * - Webhook events update payment statuses in the database
 * - Any changes could break payment processing
 * - Security implications for customer data
 * 
 * BEFORE MAKING ANY CHANGES:
 * 1. MUST inform the user/owner about proposed changes
 * 2. Get explicit written approval
 * 3. Test in isolated environment
 * 4. Review security implications
 * 5. Document all modifications
 * 
 * This is production financial code - extreme caution required!
 */

import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import Stripe from 'stripe';
import { STRIPE_CONFIG, StripeConfig } from '../stripe.config';
import { BookingsService } from '../../bookings/bookings.service';
import { MailService } from '../../mail/mail.service';
import { InjectModel } from '@nestjs/mongoose';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import { Model } from 'mongoose';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private webhookSecret?: string;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    @Inject(STRIPE_CONFIG) config: StripeConfig,
    @Inject(forwardRef(() => BookingsService)) private readonly bookingsService: BookingsService,
    @Inject(forwardRef(() => MailService)) private readonly mailService: MailService,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
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
    customer?: string;
    metadata?: Record<string, string>;
    description?: string;
  }) {
    // Ensure bookingId is present in metadata if available
    const metadata = {
      ...params.metadata,
      bookingId: params.metadata?.bookingId || '',
    };
    return await this.stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100), // Convert to cents
      currency: params.currency,
      customer: params.customer,
      metadata,
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

  async getOrCreateCustomer(email: string, name: string): Promise<Stripe.Customer> {
    // First try to find existing customer
    const customers = await this.stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return customers.data[0];
    }

    // Create new customer if not found
    return this.createCustomer(email, name);
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

  // Subscription methods
  async createSubscription(params: {
    customerId: string;
    priceId: string;
    paymentMethodId: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Subscription> {
    // Attach payment method to customer
    await this.attachPaymentMethod(params.customerId, params.paymentMethodId);

    // Set as default payment method
    await this.stripe.customers.update(params.customerId, {
      invoice_settings: {
        default_payment_method: params.paymentMethodId,
      },
    });

    // Create subscription
    return this.stripe.subscriptions.create({
      customer: params.customerId,
      items: [{ price: params.priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: params.metadata,
    });
  }

  // Create dynamic price based on customer configuration
  async createDynamicPrice(params: {
    amount: number;
    currency: string;
    interval: 'week' | 'month';
    intervalCount?: number;
    productName: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Price> {
    // First, create or get a product
    const products = await this.stripe.products.list({
      limit: 1,
      active: true,
    });

    let product: Stripe.Product;
    if (products.data.length > 0) {
      product = products.data[0];
    } else {
      product = await this.stripe.products.create({
        name: 'Cleaning Services',
        description: 'Professional cleaning services',
      });
    }

    // Ensure bookingId is present in metadata if available
    const metadata = {
      ...params.metadata,
      bookingId: params.metadata?.bookingId || '',
    };
    // Debug log
    this.logger.log('[Stripe Debug] Creating Stripe Price with metadata:', metadata);

    // Create the price
    return this.stripe.prices.create({
      unit_amount: Math.round(params.amount * 100), // Convert to cents
      currency: params.currency,
      recurring: {
        interval: params.interval,
        interval_count: params.intervalCount || 1,
      },
      product: product.id,
      metadata,
    });
  }

  // Create subscription with dynamic pricing
  async createDynamicSubscription(params: {
    customerId: string;
    paymentMethodId: string;
    amount: number;
    currency: string;
    interval: 'week' | 'month';
    intervalCount?: number;
    productName: string;
    metadata?: Record<string, string>;
    subscriptionMonths?: number; // <-- add this
  }): Promise<Stripe.Subscription> {
    // Create dynamic price
    const price = await this.createDynamicPrice({
      amount: params.amount,
      currency: params.currency,
      interval: params.interval,
      intervalCount: params.intervalCount,
      productName: params.productName,
      metadata: params.metadata,
    });

    // Attach payment method to customer
    await this.attachPaymentMethod(params.customerId, params.paymentMethodId);

    // Set as default payment method
    await this.stripe.customers.update(params.customerId, {
      invoice_settings: {
        default_payment_method: params.paymentMethodId,
      },
    });

    // Calculate cancel_at timestamp if subscriptionMonths is provided
    let cancelAt: number | undefined = undefined;
    if (params.subscriptionMonths && params.subscriptionMonths > 0) {
      const now = Math.floor(Date.now() / 1000);
      cancelAt = now + params.subscriptionMonths * 30 * 24 * 60 * 60; // Approximate months
    }

    // Ensure bookingId is present in metadata if available
    const metadata = {
      ...params.metadata,
      dynamicPriceId: price.id,
      subscriptionMonths: params.subscriptionMonths?.toString() || '',
      bookingId: params.metadata?.bookingId || '',
    };
    // Debug log
    this.logger.log('[Stripe Debug] Creating Subscription with metadata:', metadata);

    console.log({metadata})

    // Create subscription with the dynamic price
    return this.stripe.subscriptions.create({
      customer: params.customerId,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata,
      ...(cancelAt ? { cancel_at: cancelAt } : {}),
    });
  }

  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.cancel(subscriptionId);
  }

  async pauseSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.update(subscriptionId, {
      pause_collection: { behavior: 'void' },
    });
  }

  async resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.update(subscriptionId, {
      pause_collection: null,
    });
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.retrieve(subscriptionId);
  }

  async listCustomerSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
    const subscriptions = await this.stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
    });
    return subscriptions.data;
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
    this.logger.log(`[Stripe Webhook] Received event: ${event.type}`);
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata?.bookingId;
        const userId = paymentIntent.metadata?.userId;
        const amount = paymentIntent.amount_received / 100;
        let scheduleId: string | undefined = paymentIntent.metadata?.scheduleId;
        if (!scheduleId && bookingId) {
          // Find the related schedule for this booking (for one-time, should be only one)
          const schedule = await this.bookingsService['scheduleModel'].findOne({ booking: bookingId });
          if (schedule) scheduleId = String(schedule._id);
        }
        this.logger.log(`[Stripe Webhook] payment_intent.succeeded for bookingId: ${bookingId}, userId: ${userId}`);
        let paymentType = 'one-time';
        if (paymentIntent.metadata?.offSession === 'true') {
          paymentType = 'off-session';
        }
        if (bookingId && userId) {
          await this.paymentModel.create({
            booking: bookingId,
            user: userId,
            amount,
            status: 'succeeded',
            type: paymentType,
            paidAt: new Date(),
            schedule: scheduleId,
          });
        }
        this.logger.log(event.data.object)

        this.logger.log(`[Stripe Webhook] payment_intent.succeeded for bookingId: ${bookingId}, userId: ${userId}`);
        if (!bookingId) {
          this.logger.warn('[Stripe Webhook] No bookingId in paymentIntent metadata');
          return;
        }
        const booking = await this.bookingsService.findById(bookingId);
        if (booking) {
          // Update booking with Stripe customer and payment method IDs
          await this.bookingsService['bookingModel'].findByIdAndUpdate(
            bookingId,
            {
              stripeCustomerId: paymentIntent.customer,
              stripePaymentMethodId: paymentIntent.payment_method,
              paymentIntentId: paymentIntent.id,
            }
          );
          this.logger.log(`[Stripe Webhook] Updated booking ${bookingId} with customerId: ${paymentIntent.customer}, paymentMethodId: ${paymentIntent.payment_method}`);
          await this.bookingsService.updatePaymentStatus(bookingId, 'completed');
          this.logger.log(`[Stripe Webhook] Booking ${bookingId} paymentStatus set to completed (one-time payment)`);
          // Update all related schedules for this booking
          const scheduleResult = await this.bookingsService['scheduleModel'].updateMany(
            { booking: bookingId },
            { paymentStatus: 'completed' }
          );
          this.logger.log(`[Stripe Webhook] Updated all schedules for booking ${bookingId} to paymentStatus: completed. Result: ${JSON.stringify(scheduleResult)}`);
        } else {
          this.logger.warn(`[Stripe Webhook] Booking not found for bookingId: ${bookingId}`);
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        const bookingId = failedPayment.metadata?.bookingId;
        const userId = failedPayment.metadata?.userId;
        this.logger.log(`[Stripe Webhook] payment_intent.payment_failed for bookingId: ${bookingId}, userId: ${userId}`);
        if (!bookingId) {
          this.logger.warn('[Stripe Webhook] No bookingId in paymentIntent metadata');
          return;
        }
        const failedBooking = await this.bookingsService.findById(bookingId);
        if (failedBooking) {
          await this.bookingsService.updatePaymentStatus(bookingId, 'failed');
          this.logger.log(`[Stripe Webhook] Booking ${bookingId} paymentStatus set to failed (one-time payment)`);
        } else {
          this.logger.warn(`[Stripe Webhook] Booking not found for bookingId: ${bookingId}`);
        }
        break;
      }
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        this.logger.log(`[Stripe Webhook] Subscription created: ${subscription.id} for customer: ${subscription.customer}`);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        this.logger.log(`[Stripe Webhook] Subscription updated: ${subscription.id} for customer: ${subscription.customer}`);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        this.logger.log(`[Stripe Webhook] Subscription cancelled: ${subscription.id} for customer: ${subscription.customer}`);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        let bookingId: string | undefined = undefined;
        let userId: string | undefined = undefined;
        let scheduleId: string | undefined = undefined;
        if (invoice.lines && invoice.lines.data && invoice.lines.data.length > 0 && invoice.lines.data[0].metadata && invoice.lines.data[0].metadata.bookingId) {
          bookingId = invoice.lines.data[0].metadata.bookingId;
        } else if (invoice.metadata?.bookingId) {
          bookingId = invoice.metadata.bookingId;
        }
        if (invoice.customer) {
          // Try to get userId from booking
          if (bookingId) {
            const booking = await this.bookingsService.findById(bookingId);
            userId = booking?.user?._id?.toString();
          }
        }
        // Try to get the schedule that was just updated (if any)
        if (bookingId) {
          const now = new Date();
          const schedule = await this.bookingsService['scheduleModel'].findOne({ booking: bookingId, paymentStatus: 'completed', startDate: { $gte: now } }).sort({ startDate: 1 });
          if (schedule) scheduleId = String(schedule._id);
        }
        const amount = invoice.amount_paid / 100;
        if (bookingId && userId) {
          await this.paymentModel.create({
            booking: bookingId,
            user: userId,
            amount,
            status: 'succeeded',
            type: 'subscription',
            paidAt: new Date(),
            schedule: scheduleId,
          });
        }
        this.logger.log(`[Stripe Webhook] invoice.payment_succeeded for bookingId: ${bookingId}, invoice: ${invoice.id}`);
        if (bookingId) {
          // Update the earliest unpaid schedule for this booking (startDate >= now, paymentStatus != 'completed')
          const now = new Date();
          this.logger.log(`[Stripe Webhook] Schedule update criteria: { booking: ${bookingId}, paymentStatus: { $ne: 'completed' }, startDate: { $gte: ${now.toISOString()} } }`);
          const nextSchedule = await this.bookingsService['scheduleModel'].findOneAndUpdate(
            {
              booking: bookingId,
              paymentStatus: { $ne: 'completed' },
              startDate: { $gte: now }
            },
            { paymentStatus: 'completed' },
            { sort: { startDate: 1 }, new: true }
          );
          if (nextSchedule) {
            this.logger.log(`[Stripe Webhook] Updated next unpaid schedule for booking ${bookingId}: scheduleId=${nextSchedule._id}, startDate=${nextSchedule.startDate}`);
          } else {
            this.logger.warn(`[Stripe Webhook] No unpaid future schedule found for booking ${bookingId}`);
          }
          const booking = await this.bookingsService.updatePaymentStatus(bookingId, 'completed');
          this.logger.log(`[Stripe Webhook] Booking ${bookingId} paymentStatus set to completed (subscription payment)`);
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        let bookingId: string | undefined = undefined;
        if (invoice.lines && invoice.lines.data && invoice.lines.data.length > 0 && invoice.lines.data[0].metadata && invoice.lines.data[0].metadata.bookingId) {
          bookingId = invoice.lines.data[0].metadata.bookingId;
        } else if (invoice.metadata?.bookingId) {
          bookingId = invoice.metadata.bookingId;
        }
        this.logger.log(`[Stripe Webhook] invoice.payment_failed: invoice ${invoice.id}, customer: ${invoice.customer}, bookingId: ${bookingId}`);
        if (bookingId) {
          await this.bookingsService.updatePaymentStatus(bookingId, 'failed');
          this.logger.log(`[Stripe Webhook] Booking ${bookingId} paymentStatus set to failed (subscription payment)`);
        }
        break;
      }
    }
  }
} 