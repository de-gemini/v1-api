/**
 * ⚠️  CRITICAL PAYMENT CODE - DO NOT EDIT WITHOUT EXPLICIT PERMISSION ⚠️
 * 
 * This file contains payment processing logic and webhook handlers that directly
 * affect financial transactions and customer billing. Any changes to this code
 * could result in:
 * - Payment processing failures
 * - Incorrect billing
 * - Security vulnerabilities
 * - Data integrity issues
 * 
 * BEFORE MAKING ANY CHANGES:
 * 1. Inform the user/owner about the proposed changes
 * 2. Get explicit approval
 * 3. Test thoroughly in a safe environment
 * 4. Document all changes made
 * 
 * This is a financial system - treat it with extreme caution!
 */

import { Controller, Post, Body, UseGuards, Req, Res, Logger, Get, Param, Patch, NotFoundException, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { StripeService } from './services/stripe.service';
import { BookingsService } from '../bookings/bookings.service';
import { MailService } from '../mail/mail.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { success } from '../common/utils/response.util';
import { SuccessResponse } from '../common/dto/success-response.dto';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { PaymentStatus } from '../common/constants/payment-status.enum';

@ApiTags('Payments')
@Controller('payments')

export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);
  constructor(
    private readonly stripeService: StripeService,
    private readonly bookingsService: BookingsService,
    private readonly mailService: MailService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('create-payment-intent')
  @ApiOperation({ summary: 'Create a payment intent for a booking' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        bookingId: { type: 'string', example: 'booking_id_here' },
        paymentMethodId: { type: 'string', example: 'pm_12345' },
        customerEmail: { type: 'string', example: 'customer@example.com' },
        customerName: { type: 'string', example: 'John Doe' },
      },
      required: ['bookingId', 'customerEmail', 'customerName'],
    },
    description: 'The ID of the booking for which to create a payment intent.'
  })
  @ApiOkResponse({
    description: 'Payment intent created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Payment intent created successfully' },
        statusCode: { type: 'number', example: 201 },
        data: {
          type: 'object',
          properties: {
            clientSecret: { type: 'string', example: 'pi_12345_secret_67890' },
            paymentIntentId: { type: 'string', example: 'pi_12345' },
          },
        },
      },
    },
  })
  async createPaymentIntent(@Body() body: { bookingId: string, paymentMethodId?: string, customerEmail: string, customerName: string }, @Req() req: any) {
    const booking = await this.bookingsService.findOneByUser(req.user.id, body.bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    // Always get or create a Stripe customer for the user
    const customer = await this.stripeService.getOrCreateCustomer(body.customerEmail, body.customerName);
    // Create the PaymentIntent associated with the customer
    const paymentIntent = await this.stripeService.createPaymentIntent({
      amount: booking.estimatedPrice,
      currency: 'gbp',
      customer: customer.id,
      metadata: {
        bookingId: booking._id.toString(),
        userId: req.user.id.toString(),
      },
      description: `Cleaning: ${booking.serviceType} on ${booking.scheduledDate} for £${booking.estimatedPrice}`
    });
    // Update booking with payment intent ID and payment info if available
    await this.bookingsService['bookingModel'].findByIdAndUpdate(
      booking._id,
      {
        paymentIntentId: paymentIntent.id,
        stripeCustomerId: customer.id,
        ...(body.paymentMethodId ? { stripePaymentMethodId: body.paymentMethodId } : {}),
      }
    );
    // Update schedule payment status instead of booking payment status
    await this.bookingsService['scheduleModel'].updateMany(
      { booking: booking._id },
      { paymentStatus: PaymentStatus.PENDING }
    );
    return success({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    }, 'Payment intent created successfully', 201);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('create-subscription')
  @ApiOperation({ summary: 'Create a subscription for recurring payments' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        priceId: { type: 'string', example: 'price_12345' },
        paymentMethodId: { type: 'string', example: 'pm_12345' },
        customerEmail: { type: 'string', example: 'customer@example.com' },
        customerName: { type: 'string', example: 'John Doe' },
        bookingId: { type: 'string', example: 'booking_id_here' }, // <-- add this
        metadata: { 
          type: 'object', 
          example: { serviceType: 'weekly_cleaning', userId: 'user123' } 
        },
      },
      required: ['priceId', 'paymentMethodId', 'customerEmail', 'customerName', 'bookingId'],
    },
    description: 'Create a new subscription with the provided details.'
  })
  @ApiOkResponse({
    description: 'Subscription created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Subscription created successfully' },
        statusCode: { type: 'number', example: 201 },
        data: {
          type: 'object',
          properties: {
            subscriptionId: { type: 'string', example: 'sub_12345' },
            clientSecret: { type: 'string', example: 'pi_12345_secret_67890' },
            status: { type: 'string', example: 'incomplete' },
          },
        },
      },
    },
  })
  async createSubscription(
    @Body() body: {
      priceId: string;
      paymentMethodId: string;
      customerEmail: string;
      customerName: string;
      bookingId: string;
      metadata?: Record<string, string>;
    },
    @Req() req: any
  ) {
    // Get or create customer
    const customer = await this.stripeService.getOrCreateCustomer(
      body.customerEmail,
      body.customerName
    );
    // Create subscription with expand
    const subscription = await this.stripeService['stripe'].subscriptions.create({
      customer: customer.id,
      items: [{ price: body.priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        ...body.metadata,
        userId: req.user.id.toString(),
      },
    });
    // Extract client secret from the latest invoice's payment intent
    let clientSecret = null;
    let paymentIntentId = null;
    let status = subscription.status;
    if (subscription.latest_invoice && typeof subscription.latest_invoice !== 'string') {
      const latestInvoice = subscription.latest_invoice as any;
      const pi = latestInvoice.payment_intent;
      if (pi && typeof pi !== 'string') {
        clientSecret = pi.client_secret;
        paymentIntentId = pi.id;
        status = pi.status || status;
      }
    }
    // Extract hosted_invoice_url from the latest invoice
    let hostedInvoiceUrl = null;
    if (subscription.latest_invoice && typeof subscription.latest_invoice !== 'string') {
      const latestInvoice = subscription.latest_invoice as any;
      if (latestInvoice.hosted_invoice_url) {
        hostedInvoiceUrl = latestInvoice.hosted_invoice_url;
      }
    }
    // Update booking with Stripe info
    await this.bookingsService['bookingModel'].findByIdAndUpdate(
      body.bookingId,
      {
        stripeCustomerId: customer.id,
        stripePaymentMethodId: body.paymentMethodId,
        subscriptionId: subscription.id,
        isSubscription: true,
      }
    );
    return success({
      subscriptionId: subscription.id,
      clientSecret,
      paymentIntentId,
      status,
      customerId: customer.id,
      hostedInvoiceUrl,
    }, 'Subscription created successfully', 201);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('create-dynamic-subscription')
  @ApiOperation({ summary: 'Create a subscription with dynamic pricing based on customer configuration' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentMethodId: { type: 'string', example: 'pm_12345' },
        customerEmail: { type: 'string', example: 'customer@example.com' },
        customerName: { type: 'string', example: 'John Doe' },
        amount: { type: 'number', example: 50.00 },
        currency: { type: 'string', example: 'gbp' },
        interval: { type: 'string', enum: ['week', 'month'], example: 'week' },
        intervalCount: { type: 'number', example: 1 },
        productName: { type: 'string', example: 'Weekly Cleaning Service' },
        subscriptionMonths: { type: 'number', example: 3 },
        metadata: { 
          type: 'object', 
          example: { 
            serviceType: 'weekly_cleaning', 
            userId: 'user123',
            roomCounts: '{"bedroom":2,"bathroom":1}',
            addOns: '{"ecoFriendly":true,"hooverMop":true}'
          } 
        },
      },
      required: ['paymentMethodId', 'customerEmail', 'customerName', 'amount', 'currency', 'interval', 'productName'],
    },
    description: 'Create a new subscription with dynamic pricing based on customer configuration.'
  })
  @ApiOkResponse({
    description: 'Dynamic subscription created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Dynamic subscription created successfully' },
        statusCode: { type: 'number', example: 201 },
        data: {
          type: 'object',
          properties: {
            subscriptionId: { type: 'string', example: 'sub_12345' },
            priceId: { type: 'string', example: 'price_12345' },
            clientSecret: { type: 'string', example: 'pi_12345_secret_67890' },
            status: { type: 'string', example: 'incomplete' },
          },
        },
      },
    },
  })
  async createDynamicSubscription(
    @Body() body: {
      paymentMethodId: string;
      customerEmail: string;
      customerName: string;
      amount: number;
      currency: string;
      interval: 'week' | 'month';
      intervalCount?: number;
      productName: string;
      subscriptionMonths?: number;
      metadata?: Record<string, string>;
    },
    @Req() req: any
  ) {
    // Get or create customer
    const customer = await this.stripeService.getOrCreateCustomer(
      body.customerEmail,
      body.customerName
    );

    // Create dynamic subscription with expand
    const subscription = await this.stripeService['stripe'].subscriptions.create({
      customer: customer.id,
      items: [{ price: (await this.stripeService.createDynamicPrice({
        amount: body.amount,
        currency: body.currency,
        interval: body.interval,
        intervalCount: body.intervalCount,
        productName: body.productName,
        metadata: {
          ...body.metadata,
          userId: req.user.id.toString(),
        },
      })).id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        ...body.metadata,
        userId: req.user.id.toString(),
      },
      ...(body.subscriptionMonths ? { cancel_at: Math.floor(Date.now() / 1000) + body.subscriptionMonths * 30 * 24 * 60 * 60 } : {}),
    });

    // Extract client secret from the latest invoice's payment intent
    let clientSecret = null;
    let paymentIntentId = null;
    let status = subscription.status;
    if (subscription.latest_invoice && typeof subscription.latest_invoice !== 'string') {
      const latestInvoice = subscription.latest_invoice as any;
      const pi = latestInvoice.payment_intent;
      if (pi && typeof pi !== 'string') {
        clientSecret = pi.client_secret;
        paymentIntentId = pi.id;
        status = pi.status || status;
      }
    }

    // Extract hosted_invoice_url from the latest invoice
    let hostedInvoiceUrl = null;
    if (subscription.latest_invoice && typeof subscription.latest_invoice !== 'string') {
      const latestInvoice = subscription.latest_invoice as any;
      if (latestInvoice.hosted_invoice_url) {
        hostedInvoiceUrl = latestInvoice.hosted_invoice_url;
      }
    }

    return success({
      subscriptionId: subscription.id,
      priceId: subscription.metadata?.dynamicPriceId,
      clientSecret,
      paymentIntentId,
      invoiceId: (subscription.latest_invoice && typeof subscription.latest_invoice !== 'string') ? (subscription.latest_invoice as any).id : null,
      status,
      customerId: customer.id,
      hostedInvoiceUrl,
    }, 'Dynamic subscription created successfully', 201);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('subscriptions/:customerId')
  @ApiOperation({ summary: 'Get all subscriptions for a customer' })
  @ApiOkResponse({
    description: 'Customer subscriptions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Subscriptions retrieved successfully' },
        statusCode: { type: 'number', example: 200 },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'sub_12345' },
              status: { type: 'string', example: 'active' },
              current_period_start: { type: 'number', example: 1640995200 },
              current_period_end: { type: 'number', example: 1643673600 },
            },
          },
        },
      },
    },
  })
  async getCustomerSubscriptions(@Param('customerId') customerId: string) {
    const subscriptions = await this.stripeService.listCustomerSubscriptions(customerId);
    
    return success(
      subscriptions.map(sub => ({
        id: sub.id,
        status: sub.status,
        current_period_start: (sub as any).current_period_start,
        current_period_end: (sub as any).current_period_end,
        items: sub.items.data,
        metadata: sub.metadata,
      })),
      'Subscriptions retrieved successfully'
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('subscriptions/:subscriptionId/cancel')
  @ApiOperation({ summary: 'Cancel a subscription' })
  @ApiOkResponse({
    description: 'Subscription cancelled successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Subscription cancelled successfully' },
        statusCode: { type: 'number', example: 200 },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'sub_12345' },
            status: { type: 'string', example: 'canceled' },
          },
        },
      },
    },
  })
  async cancelSubscription(@Param('subscriptionId') subscriptionId: string) {
    const subscription = await this.stripeService.cancelSubscription(subscriptionId);
    
    return success({
      id: subscription.id,
      status: subscription.status,
    }, 'Subscription cancelled successfully');
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('subscriptions/:subscriptionId/pause')
  @ApiOperation({ summary: 'Pause a subscription' })
  @ApiOkResponse({
    description: 'Subscription paused successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Subscription paused successfully' },
        statusCode: { type: 'number', example: 200 },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'sub_12345' },
            status: { type: 'string', example: 'active' },
          },
        },
      },
    },
  })
  async pauseSubscription(@Param('subscriptionId') subscriptionId: string) {
    const subscription = await this.stripeService.pauseSubscription(subscriptionId);
    
    return success({
      id: subscription.id,
      status: subscription.status,
    }, 'Subscription paused successfully');
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('subscriptions/:subscriptionId/resume')
  @ApiOperation({ summary: 'Resume a paused subscription' })
  @ApiOkResponse({
    description: 'Subscription resumed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Subscription resumed successfully' },
        statusCode: { type: 'number', example: 200 },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'sub_12345' },
            status: { type: 'string', example: 'active' },
          },
        },
      },
    },
  })
  async resumeSubscription(@Param('subscriptionId') subscriptionId: string) {
    const subscription = await this.stripeService.resumeSubscription(subscriptionId);
    
    return success({
      id: subscription.id,
      status: subscription.status,
    }, 'Subscription resumed successfully');
  }

  @Get('invoice/:invoiceId')
  async getInvoice(@Param('invoiceId') invoiceId: string) {
    const invoice = await this.stripeService['stripe'].invoices.retrieve(invoiceId, {
      expand: ['payment_intent'],
    });
    console.log('[Invoice Polling] Invoice:', JSON.stringify(invoice, null, 2));
    const paymentIntent = (invoice as any).payment_intent;
    console.log('[Invoice Polling] paymentIntent:', paymentIntent);
    return {
      invoiceId,
      paymentIntentId: paymentIntent?.id || null,
      clientSecret: paymentIntent?.client_secret || null,
      status: paymentIntent?.status || null,
    };
  }

  @Get('subscription/:subscriptionId')
  async getSubscription(@Param('subscriptionId') subscriptionId: string) {
    const subscription = await this.stripeService['stripe'].subscriptions.retrieve(subscriptionId, {
      expand: ['latest_invoice.payment_intent'],
    });
    let paymentIntent: Stripe.PaymentIntent | null = null;
    let invoiceId: string | null = null;
    if (subscription.latest_invoice && typeof subscription.latest_invoice !== 'string') {
      const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
      invoiceId = latestInvoice.id ?? null;
      const pi = (latestInvoice as any).payment_intent;
      if (pi && typeof pi !== 'string') {
        paymentIntent = pi as Stripe.PaymentIntent;
      }
    }
    return {
      subscriptionId,
      invoiceId: invoiceId ?? null,
      paymentIntentId: paymentIntent?.id ?? null,
      clientSecret: paymentIntent?.client_secret ?? null,
      status: paymentIntent?.status ?? null,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('records')
  @ApiOperation({ summary: 'Get paginated payment records' })
  async getPaymentRecords(@Query('page') page = 1, @Query('limit') limit = 10) {
    const skip = (Number(page) - 1) * Number(limit);
    const [payments, total] = await Promise.all([
      this.stripeService['paymentModel']
        .find()
        .populate('booking')
        .populate('user', '-password')
        .sort({ paidAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      this.stripeService['paymentModel'].countDocuments(),
    ]);
    return success({
      payments,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    }, 'Payment records fetched successfully');
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook processed successfully'
  })
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    // this.logger.debug('Received Stripe webhook');
    // this.logger.debug('Headers: ' + JSON.stringify(req.headers));
    // this.logger.debug('Body: ' + (typeof req.body === 'string' ? req.body : '[Buffer]'));
    const sig = req.headers['stripe-signature'] as string;
    let event;
    try {
      event = await this.stripeService.constructEventFromWebhook(
        req.body, // raw body
        sig,
      );
    } catch (err) {
      this.logger.error('Webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    try {
      await this.stripeService.handleWebhookEvent(event);
    } catch (err) {
      this.logger.error('Error handling webhook event:', err);
      return res.status(500).send('Internal Server Error');
    }
    return res.json({ received: true });
  }

  @Post('save-payment-method')
  @ApiOperation({ summary: 'Save Stripe customer and payment method to booking' })
  async savePaymentMethod(
    @Body() body: { bookingId: string, stripeCustomerId: string, stripePaymentMethodId: string, confirmedIntent:any }
  ) {
    console.log({body})
    await this.bookingsService['bookingModel'].findByIdAndUpdate(
      body.bookingId,
      {
        stripeCustomerId: body.stripeCustomerId,
        stripePaymentMethodId: body.stripePaymentMethodId,
      }
    );
    return { success: true };
  }

  @Patch('extra-charge/:bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Charge extra amount off-session' })
  async extraCharge(
    @Param('bookingId') bookingId: string,
    @Body() body: { amount: number, reason?: string, scheduleId?: string }
  ) {
    // Debug: Log bookingId received
    console.log('[Off-Session Charge] Received bookingId from client:', bookingId);
    // Find the booking
    const booking = await this.bookingsService.findById(bookingId);
    // Debug: Log booking fetched
    console.log('[Off-Session Charge] Booking fetched from DB:', booking);
    if (!booking || !booking.stripeCustomerId || !booking.stripePaymentMethodId) {
      throw new NotFoundException('Booking or payment info not found');
    }
    try {
      const paymentIntent = await this.stripeService['stripe'].paymentIntents.create({
        amount: Math.round(body.amount * 100),
        currency: 'gbp',
        customer: booking.stripeCustomerId,
        payment_method: booking.stripePaymentMethodId,
        off_session: true,
        confirm: true,
        description: body.reason || 'Admin off-session charge',
        metadata: {
          bookingId,
          userId: booking.user?._id?.toString() || '',
          reason: body.reason || '',
          admin: 'admin_user_id_or_email',
          ...(body.scheduleId ? { scheduleId: body.scheduleId } : {}),
          offSession: 'true',
        }
      });
      return { success: true, paymentIntent };
    } catch (err: any) {
      if (err.code === 'authentication_required' && err.payment_intent?.next_action?.use_stripe_sdk?.stripe_js) {
        return {
          success: false,
          paymentLink: err.payment_intent.next_action.use_stripe_sdk.stripe_js,
          message: 'Off-session charge requires customer action.',
        };
      }
      throw err;
    }
  }
} 