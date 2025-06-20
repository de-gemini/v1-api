import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCleaningTimeDto {
  @ApiProperty({ 
    description: 'Name of the room type',
    example: 'bedroom'
  })
  @IsString()
  name: string;

  @ApiProperty({ 
    description: 'Cleaning time in minutes',
    example: 40,
    minimum: 1,
    maximum: 480
  })
  @IsNumber()
  @Min(1)
  @Max(480) // 8 hours max
  cleaningTime: number;


} 