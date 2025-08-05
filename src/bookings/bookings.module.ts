import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsController, BookingsController2 } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { PricingService } from './services/pricing.service';
import { PricingStoreService } from '../common/pricing/pricingStore';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { Schedule, ScheduleSchema } from './schemas/schedule.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';
import { SystemSettingsModule } from '../system-settings/system-settings.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Schedule.name, schema: ScheduleSchema },
      { name: User.name, schema: UserSchema },
    ]),
    MailModule,
    UsersModule,
    SystemSettingsModule,
  ],
  controllers: [BookingsController,BookingsController2],
  providers: [BookingsService, PricingService, PricingStoreService],
  exports: [BookingsService],
})
export class BookingsModule {}
