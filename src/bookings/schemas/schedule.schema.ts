import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Booking } from './booking.schema';
import { PaymentStatus } from '../../common/constants/payment-status.enum';

export type ScheduleDocument = Schedule & Document;

export enum ScheduleFrequency {
  ONETIME = 'onetime',
  WEEKLY = 'weekly',
  FORTNIGHT = 'fortnight',
  MONTHLY = 'monthly',
}

export enum ScheduleStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Schedule {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Booking', required: true })
  booking: MongooseSchema.Types.ObjectId | Booking;

  @Prop({ type: String, enum: ScheduleFrequency, required: true })
  frequency: ScheduleFrequency;
  
  @Prop({ type: String, enum: ScheduleStatus, required: true, default: ScheduleStatus.PENDING })
  status: ScheduleStatus;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({type:Boolean,default:false})
  paidWithCash:boolean;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ type: Number, min: 0, max: 6 })
  dayOfWeek?: number; // For weekly/fortnight

  @Prop({ type: Number, min: 1, max: 31 })
  dayOfMonth?: number; // For monthly

  @Prop({ type: String, required: true })
  time: string; // 'HH:mm'

  @Prop({ 
    type: String, 
    enum: Object.values(PaymentStatus), 
    default: PaymentStatus.PENDING 
  })
  paymentStatus: PaymentStatus;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule); 