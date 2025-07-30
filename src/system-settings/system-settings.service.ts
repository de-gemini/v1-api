import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SystemSettings, SystemSettingsDocument } from './schemas/system-settings.schema';

@Injectable()
export class SystemSettingsService {
  constructor(
    @InjectModel(SystemSettings.name) private systemSettingsModel: Model<SystemSettingsDocument>,
  ) {}

  async getSettings(): Promise<SystemSettings> {
    let settings = await this.systemSettingsModel.findOne({ name: 'main' }).exec();
    
    if (!settings) {
      // Create default settings if none exist
      settings = await this.systemSettingsModel.create({
        name: 'main',
        settings: {
          reminderEmails: {
            enabled: false,
            frequency: 'none',
          },
          bookingPrevention: {
            enabled: false,
          },
          businessHours: {
            start: '09:00',
            end: '17:00',
          },
          minimumBookingNotice: 24,
          maxBookingsPerDay: 10,
        },
      });
    }
    
    return settings;
  }

  async updateSettings(updateData: Partial<SystemSettings['settings']>): Promise<SystemSettings> {
    const settings = await this.systemSettingsModel.findOne({ name: 'main' }).exec();
    
    if (!settings) {
      throw new NotFoundException('System settings not found');
    }
    
    // Merge the new settings with existing ones
    settings.settings = {
      ...settings.settings,
      ...updateData,
    };
    
    return await settings.save();
  }

  async updateReminderEmails(reminderSettings: {
    enabled: boolean;
    frequency: 'none' | '4hours' | '12hours' | '24hours' | 'custom';
    customHours?: number;
  }): Promise<SystemSettings> {
    return this.updateSettings({
      reminderEmails: reminderSettings,
    });
  }

  async updateBookingPrevention(bookingPrevention: {
    enabled: boolean;
    reason?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<SystemSettings> {
    return this.updateSettings({
      bookingPrevention,
    });
  }

  async isBookingPreventionEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.settings.bookingPrevention.enabled;
  }

  async getReminderEmailSettings(): Promise<{
    enabled: boolean;
    frequency: string;
    customHours?: number;
  }> {
    const settings = await this.getSettings();
    return settings.settings.reminderEmails;
  }
} 