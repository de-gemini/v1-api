import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MailService } from './mail.service';
import { Schedule, ScheduleSchema } from '../bookings/schemas/schedule.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Schedule.name, schema: ScheduleSchema }
    ])
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
