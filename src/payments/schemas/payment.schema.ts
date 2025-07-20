import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Booking } from '../../bookings/schemas/booking.schema';
import { User } from '../../users/schemas/user.schema';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Booking', required: true })
  booking: Booking;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  status: string; // 'succeeded', 'failed', etc.

  @Prop({ required: true })
  type: string; // 'one-time', 'subscription', etc.

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Schedule', required: false })
  schedule?: any;

  @Prop({ type: Date, default: Date.now })
  paidAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment); 