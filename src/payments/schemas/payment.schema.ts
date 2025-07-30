/**
 * ⚠️  CRITICAL PAYMENT SCHEMA - DO NOT EDIT WITHOUT EXPLICIT PERMISSION ⚠️
 * 
 * This schema defines the payment data structure used for:
 * - Financial transaction records
 * - Payment status tracking
 * - Billing history
 * - Audit trails
 * 
 * WARNING:
 * - Changes to this schema affect payment data integrity
 * - Could break existing payment records
 * - Impacts financial reporting
 * 
 * BEFORE MAKING ANY CHANGES:
 * 1. Inform the user/owner about proposed changes
 * 2. Get explicit approval
 * 3. Consider data migration implications
 * 4. Test thoroughly
 * 
 * This is financial data - handle with extreme care!
 */

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

  @Prop({ 
    required: true,
    get: (val: number) => val ? Math.round(val * 100) / 100 : val,
    set: (val: number) => val ? Math.round(val * 100) / 100 : val
  })
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

// Enable getters so money fields are automatically rounded to 2dp when fetched
PaymentSchema.set('toJSON', { getters: true });
PaymentSchema.set('toObject', { getters: true }); 