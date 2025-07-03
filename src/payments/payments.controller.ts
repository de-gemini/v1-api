import { Controller, Post, Body, UseGuards, Req, Res, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { StripeService } from './services/stripe.service';
import { BookingsService } from '../bookings/bookings.service';
import { MailService } from '../mail/mail.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { success } from '../common/utils/response.util';
import { SuccessResponse } from '../common/dto/success-response.dto';
import { Request, Response } from 'express';

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
      },
      required: ['bookingId'],
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
  async createPaymentIntent(@Body() body: { bookingId: string }, @Req() req: any) {
    const booking = await this.bookingsService.findOneByUser(req.user.id, body.bookingId);
    
    if (!booking) {
      throw new Error('Booking not found');
    }

    const paymentIntent = await this.stripeService.createPaymentIntent({
      amount: booking.estimatedPrice,
      currency: 'gbp',
      metadata: {
        bookingId: booking._id.toString(),
        userId: req.user.id.toString(),
      },
      description: `Cleaning: ${booking.serviceType} on ${booking.scheduledDate} for £${booking.estimatedPrice}`
    });

    // Update booking with payment intent ID
    await this.bookingsService.updatePaymentStatus(booking._id.toString(), 'pending');

    return success({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    }, 'Payment intent created successfully', 201);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook processed successfully'
  })
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    this.logger.debug('Received Stripe webhook');
    this.logger.debug('Headers: ' + JSON.stringify(req.headers));
    this.logger.debug('Body: ' + (typeof req.body === 'string' ? req.body : '[Buffer]'));
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
} 