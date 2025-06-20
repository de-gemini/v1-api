import { IsEnum, IsString, IsDate, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScheduleFrequency } from '../schemas/schedule.schema';

export class CreateScheduleDto {
  @ApiProperty({ type: String, description: 'Booking ID', example: '64e8b7f2c2a4e2a1b8c9d0e1' })
  @IsString()
  booking: string;

  @ApiProperty({ enum: ScheduleFrequency, example: ScheduleFrequency.WEEKLY })
  @IsEnum(ScheduleFrequency)
  frequency: ScheduleFrequency;

  @ApiProperty({ type: Date, example: '2025-07-10T14:00:00.000Z' })
  @IsDate()
  startDate: Date;

  @ApiPropertyOptional({ type: Date, example: '2025-12-10T14:00:00.000Z' })
  @IsOptional()
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ type: Number, description: '0=Sunday, 6=Saturday', example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiPropertyOptional({ type: Number, description: '1-31', example: 15 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  dayOfMonth?: number;

  @ApiProperty({ type: String, description: 'Time in HH:mm format', example: '09:30' })
  @IsString()
  time: string;
} 