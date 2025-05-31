import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { StripeService } from './services/stripe.service';
import { BookingsModule } from '../bookings/bookings.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    ConfigModule,
    BookingsModule,
    MailModule,
  ],
  controllers: [PaymentsController],
  providers: [StripeService],
  exports: [StripeService],
})
export class PaymentsModule {} 