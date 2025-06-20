import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CleaningTime, CleaningTimeSchema } from './schemas/cleaning_time.schema';
import { CleaningTimeService } from './cleaning-time.service';
import { CleaningTimeController } from './cleaning-time.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CleaningTime.name, schema: CleaningTimeSchema },
    ]),
  ],
  controllers: [CleaningTimeController],
  providers: [CleaningTimeService],
  exports: [CleaningTimeService],
})
export class CleaningTimeModule {}
