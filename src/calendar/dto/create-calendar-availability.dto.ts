import { IsInt, Min, Max, IsOptional, IsBoolean, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCalendarAvailabilityDto {
  @ApiProperty({ example: 2025, description: 'Year' })
  @IsInt()
  year: number;

  @ApiProperty({ example: 6, description: 'Month (1-12)' })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ example: 15, description: 'Day (1-31)' })
  @IsInt()
  @Min(1)
  @Max(31)
  day: number;

  @ApiPropertyOptional({ example: true, description: 'Whether the day is available for booking' })
  @IsOptional()
  @IsBoolean()
  available?: boolean = true;

  @ApiPropertyOptional({ example: 'Special event', description: 'Optional note for the day' })
  @IsOptional()
  @IsString()
  note?: string;
} 