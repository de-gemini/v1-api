import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CalendarAvailability, CalendarAvailabilitySchema } from './calendar.schema';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CalendarAvailability.name, schema: CalendarAvailabilitySchema },
    ]),
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {} 