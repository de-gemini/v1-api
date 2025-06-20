import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StripeService } from './services/stripe.service';
import { BookingsService } from '../bookings/bookings.service';
import { MailService } from '../mail/mail.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { success } from '../common/utils/response.util';
import { SuccessResponse } from '../common/dto/success-response.dto';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly bookingsService: BookingsService,
    private readonly mailService: MailService,
  ) {}

  @Post('create-payment-intent')
  @ApiOperation({ summary: 'Create a payment intent for a booking' })
  @ApiResponse({ status: 201, type: SuccessResponse })
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
        userId: req.user.id,
      },
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
  async handleWebhook(@Body() event: any) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const booking = await this.bookingsService.findById(paymentIntent.metadata.bookingId);
        
        if (booking) {
          await this.bookingsService.updatePaymentStatus(
            paymentIntent.metadata.bookingId,
            'completed'
          );
          
          await this.mailService.sendBookingConfirmation(
            booking.user,
            booking,
          );
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        const failedBooking = await this.bookingsService.findById(failedPayment.metadata.bookingId);
        
        if (failedBooking) {
          await this.bookingsService.updatePaymentStatus(
            failedPayment.metadata.bookingId,
            'failed'
          );
          
          await this.mailService.sendPaymentFailedNotification(
            failedBooking.user,
            failedBooking,
          );
        }
        break;
    }

    return { received: true };
  }
} 