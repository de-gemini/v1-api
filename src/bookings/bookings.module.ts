import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { PricingService } from './services/pricing.service';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { Schedule, ScheduleSchema } from './schemas/schedule.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Schedule.name, schema: ScheduleSchema },
      { name: User.name, schema: UserSchema },
    ]),
    MailModule,
    UsersModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, PricingService],
  exports: [BookingsService],
})
export class BookingsModule {}
