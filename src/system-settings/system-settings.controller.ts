import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SystemSettingsService } from './system-settings.service';
import { success } from '../common/utils/response.util';
import { SuccessResponse } from '../common/dto/success-response.dto';

@ApiTags('System Settings')
@Controller('system-settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get system settings' })
  @ApiResponse({ status: 200, type: SuccessResponse })
  async getSettings() {
    const settings = await this.systemSettingsService.getSettings();
    return success(settings, 'System settings retrieved successfully');
  }

  @Patch('reminder-emails')
  @ApiOperation({ summary: 'Update reminder email settings' })
  @ApiResponse({ status: 200, type: SuccessResponse })
  async updateReminderEmails(
    @Body() body: {
      enabled: boolean;
      frequency: 'none' | '4hours' | '12hours' | '24hours' | 'custom';
      customHours?: number;
    }
  ) {
    const settings = await this.systemSettingsService.updateReminderEmails(body);
    return success(settings, 'Reminder email settings updated successfully');
  }

  @Patch('booking-prevention')
  @ApiOperation({ summary: 'Update booking prevention settings' })
  @ApiResponse({ status: 200, type: SuccessResponse })
  async updateBookingPrevention(
    @Body() body: {
      enabled: boolean;
      reason?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const settings = await this.systemSettingsService.updateBookingPrevention(body);
    return success(settings, 'Booking prevention settings updated successfully');
  }

  @Get('booking-prevention-status')
  @ApiOperation({ summary: 'Check if booking prevention is enabled' })
  @ApiResponse({ status: 200, type: SuccessResponse })
  async getBookingPreventionStatus() {
    const isEnabled = await this.systemSettingsService.isBookingPreventionEnabled();
    return success({ isEnabled }, 'Booking prevention status retrieved successfully');
  }
} 