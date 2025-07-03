import { DynamicModule, Module, Provider } from '@nestjs/common';
import { StripeService } from './services/stripe.service';
import { PaymentsController } from './payments.controller';
import { BookingsModule } from '../bookings/bookings.module';
import { MailModule } from '../mail/mail.module';
import { STRIPE_CONFIG, StripeConfig } from './stripe.config';
import { BookingsService } from 'src/bookings/bookings.service';

@Module({})
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
      exports: [StripeService],
    };
  }
} 