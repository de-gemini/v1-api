import { DynamicModule, Module, Provider } from '@nestjs/common';
import { StripeService } from './services/stripe.service';
import { PaymentsController } from './payments.controller';
import { BookingsModule } from '../bookings/bookings.module';
import { MailModule } from '../mail/mail.module';
import { STRIPE_CONFIG, StripeConfig } from './stripe.config';
import { BookingsService } from 'src/bookings/bookings.service';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: User.name, schema: UserSchema },
    ]),
    BookingsModule,
    MailModule,
  ],
})
export class PaymentsModule {
  static forRootAsync(options: {
    useFactory: (...args: any[]) => Promise<StripeConfig> | StripeConfig,
    inject?: any[],
    imports?: any[],
  }): DynamicModule {
    const stripeConfigProvider: Provider = {
      provide: STRIPE_CONFIG,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };
    return {
      module: PaymentsModule,
      imports: options.imports || [BookingsModule],
      controllers: [PaymentsController],
      providers: [stripeConfigProvider, StripeService],
      exports: [StripeService, STRIPE_CONFIG],
    };
  }
} 