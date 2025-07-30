import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SystemSettingsDocument = SystemSettings & Document;

@Schema({ timestamps: true })
export class SystemSettings {
  @Prop({ required: true, unique: true, default: 'main' })
  name: string;

  @Prop({ type: Object, required: true })
  settings: {
    // Reminder Email Settings
    reminderEmails: {
      enabled: boolean;
      frequency: 'none' | '4hours' | '12hours' | '24hours' | 'custom';
      customHours?: number;
    };
    
    // Booking Prevention Settings
    bookingPrevention: {
      enabled: boolean;
      reason?: string;
      startDate?: Date;
      endDate?: Date;
    };
    
    // General Settings
    businessHours: {
      start: string; // "09:00"
      end: string;   // "17:00"
    };
    
    minimumBookingNotice: number; // hours
    maxBookingsPerDay: number;
  };

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const SystemSettingsSchema = SchemaFactory.createForClass(SystemSettings); 