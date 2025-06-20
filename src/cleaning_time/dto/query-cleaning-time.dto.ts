import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryCleaningTimeDto {
  @ApiPropertyOptional({ 
    description: 'Search by room name',
    example: 'bedroom'
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ 
    description: 'Minimum cleaning time in minutes',
    example: 30
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minTime?: number;

  @ApiPropertyOptional({ 
    description: 'Maximum cleaning time in minutes',
    example: 60
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxTime?: number;

  @ApiPropertyOptional({ 
    description: 'Page number for pagination',
    example: 1,
    default: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Number of items per page',
    example: 10,
    default: 10
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
} 