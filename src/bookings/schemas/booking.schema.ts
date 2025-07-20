import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Base, BaseDocument } from '../../common/schemas/base.schema';

export type BookingDocument = Booking & BaseDocument;

export enum CleaningFrequency {
  ONETIME = 'onetime',
  FORTNIGHT = 'fortnight',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

@Schema({ timestamps: true })
export class Booking extends Base {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ required: true })
  serviceType: string;

  @Prop({ required: true })
  scheduledDate: Date;

  @Prop({ type: Number, min: 0, max: 6 })
  scheduledDayOfWeek?: number;

  @Prop({ type: Number, min: 1, max: 31 })
  scheduledDayOfMonth?: number;

  @Prop({ type: String })
  scheduledTime?: string;

  @Prop({ type: Date })
  scheduledDateTime?: Date;

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

  @Prop({
    type: String,
    enum: CleaningFrequency,
    required: true,
  })
  frequency: CleaningFrequency;

  @Prop({ default: false })
  endOftenancy: boolean;

  @Prop({ default: false })
  expressStudio: boolean;

  @Prop({ default: false })
  ecofriendlyProduct: boolean;

  @Prop()
  errandHours: number;

  @Prop()
  havePets: boolean;

  @Prop({ type: String, default: null })
  whereToPickKey: string | null;

  @Prop({ default: 1 })
  subscriptionMonths: number;

  @Prop({ default: 1 })
  schedulesCount: number;

  @Prop({ default: false })
  isSubscription: boolean;

  @Prop()
  subscriptionId: string;

  @Prop()
  stripePaymentMethodId: string;

  @Prop({
    type: [
      {
        type: Object,
        required: true,
        properties: {
          type: { type: String, required: true },
          quantity: { type: Number, required: true },
          estimatedTime: { type: Number, required: true },
        },
      },
    ],
    required: true,
  })
  rooms: {
    type: string;
    quantity: number;
    estimatedTime: number;
  }[];

  @Prop({ required: false })
  serverPrice?: number;

  @Prop({ required: false })
  clientPrice?: number;
}

export const BookingSchema = SchemaFactory.createForClass(Booking); 