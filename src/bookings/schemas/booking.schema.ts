import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type BookingDocument = Booking & Document;

@Schema({ timestamps: true })
export class Booking {
  _id: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ required: true })
  serviceType: string;

  @Prop({ required: true })
  scheduledDate: Date;

  @Prop({ required: true })
  address: string;

  @Prop({ default: 'pending' })
  status: string;

  @Prop()
  notes: string;

  @Prop({ required: true })
  estimatedPrice: number;

  @Prop({ required: true })
  estimatedDuration: number;

  @Prop()
  paymentIntentId: string;

  @Prop()
  stripeCustomerId: string;

  @Prop({ default: 'pending' })
  paymentStatus: string;

  @Prop()
  actualDuration: number;

  @Prop()
  actualPrice: number;

  @Prop({ type: Date })
  completedAt: Date;
}

export const BookingSchema = SchemaFactory.createForClass(Booking); 