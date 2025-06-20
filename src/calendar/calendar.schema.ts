import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CalendarAvailabilityDocument = CalendarAvailability & Document;

@Schema({ timestamps: true })
export class CalendarAvailability {
  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  month: number; // 1-12

  @Prop({ required: true })
  day: number; // 1-31

  @Prop({ default: true })
  available: boolean;

  @Prop()
  note?: string;
}

export const CalendarAvailabilitySchema = SchemaFactory.createForClass(CalendarAvailability); 