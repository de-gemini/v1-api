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

  @Prop({ default: 'pending', select: false }) // Exclude from queries by default
  status: string;

  @Prop({ default: 'pending', select: false }) // Exclude from queries by default
  paymentStatus: string;

  @Prop()
  notes: string;

  @Prop({ 
    required: true,
    get: (val: number) => val ? Math.round(val * 100) / 100 : val,
    set: (val: number) => val ? Math.round(val * 100) / 100 : val
  })
  estimatedPrice: number;

  @Prop({ required: true })
  estimatedDuration: number;

  @Prop()
  paymentIntentId: string;

  @Prop()
  stripeCustomerId: string;

  @Prop({ 
    type: String, 
    enum: ['card', 'cash', 'pending'],
    default: 'pending' 
  })
  paymentMethod: string;

  @Prop()
  actualDuration: number;

  @Prop({ 
    get: (val: number) => val ? Math.round(val * 100) / 100 : val,
    set: (val: number) => val ? Math.round(val * 100) / 100 : val
  })
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

  @Prop({ 
    required: false,
    get: (val: number) => val ? Math.round(val * 100) / 100 : val,
    set: (val: number) => val ? Math.round(val * 100) / 100 : val
  })
  serverPrice?: number;

  @Prop({ 
    required: false,
    get: (val: number) => val ? Math.round(val * 100) / 100 : val,
    set: (val: number) => val ? Math.round(val * 100) / 100 : val
  })
  clientPrice?: number;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

// Enable getters so money fields are automatically rounded to 2dp when fetched
BookingSchema.set('toJSON', { getters: true });
BookingSchema.set('toObject', { getters: true }); 