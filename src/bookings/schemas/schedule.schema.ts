import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Booking } from './booking.schema';

export type ScheduleDocument = Schedule & Document;

export enum ScheduleFrequency {
  ONETIME = 'onetime',
  WEEKLY = 'weekly',
  FORTNIGHT = 'fortnight',
  MONTHLY = 'monthly',
}

@Schema({ timestamps: true })
export class Schedule {
  // @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Booking', required: true })
  // booking: Booking;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Booking', required: true })
  booking: MongooseSchema.Types.ObjectId | Booking;

  @Prop({ type: String, enum: ScheduleFrequency, required: true })
  frequency: ScheduleFrequency;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ type: Number, min: 0, max: 6 })
  dayOfWeek?: number; // For weekly/fortnight

  @Prop({ type: Number, min: 1, max: 31 })
  dayOfMonth?: number; // For monthly

  @Prop({ type: String, required: true })
  time: string; // 'HH:mm'
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule); 