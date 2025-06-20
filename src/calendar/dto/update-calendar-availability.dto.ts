import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCalendarAvailabilityDto {
  @ApiPropertyOptional({ example: true, description: 'Whether the day is available for booking' })
  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @ApiPropertyOptional({ example: 'Holiday', description: 'Optional note for the day' })
  @IsOptional()
  @IsString()
  note?: string;
} 