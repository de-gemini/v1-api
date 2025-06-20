import { IsString, IsNumber, IsDate, IsOptional, IsEnum, IsArray, ValidateNested, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CleaningFrequency } from '../schemas/booking.schema';

export enum RoomType {
  BEDROOM = 'bedroom',
  LIVING_ROOM = 'living_room',
  BATHROOM = 'bathroom',
  KITCHEN = 'kitchen',
  HALL = 'hall',
  OFFICE = 'office',
  CONSERVATORY = 'conservatory',
  GARAGE = 'garage',
  TOILET = 'toilet',
  STAIRCASE = 'staircase'
}

export enum ServiceType {
  REGULAR_ONEOFF = 'regular_oneoff',
  END_OF_TENANCY = 'end_of_tenancy',
  CARPET_UPHOLSTERY = 'carpet_upholstery'
}

export enum DirtLevel {
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy'
}

export class RoomDetails {
  @ApiProperty({ enum: RoomType })
  @IsEnum(RoomType)
  type: RoomType;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  estimatedTime: number;
}

export class CreateBookingDto {
  @ApiProperty({ enum: ServiceType, example: ServiceType.REGULAR_ONEOFF })
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiProperty({ type: [RoomDetails], example: [{ type: 'bedroom', quantity: 2, estimatedTime: 45 }] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomDetails)
  rooms: RoomDetails[];

  @ApiProperty({ example: '123 Main St, London' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'E1 6AN' })
  @IsString()
  postcode: string;

  @ApiPropertyOptional({ type: Date, example: '2025-07-10T14:00:00.000Z', description: 'Ignored for schedule generation; schedules start from today.' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  scheduledDate?: Date;

  @ApiProperty({ enum: DirtLevel, default: DirtLevel.MEDIUM, example: DirtLevel.MEDIUM })
  @IsEnum(DirtLevel)
  @IsOptional()
  dirtLevel: DirtLevel;

  @ApiProperty({ example: 120 })
  @IsNumber()
  estimatedDuration: number;

  @ApiProperty({ example: 80 })
  @IsNumber()
  estimatedPrice: number;

  @ApiPropertyOptional({ example: 'Please call on arrival.' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 'SUMMER21' })
  @IsString()
  @IsOptional()
  promoCode?: string;

  @ApiProperty({ enum: CleaningFrequency, example: CleaningFrequency.WEEKLY })
  @IsEnum(CleaningFrequency)
  frequency: CleaningFrequency;

  @ApiPropertyOptional({ default: false, example: false })
  @IsBoolean()
  @IsOptional()
  endOftenancy?: boolean;

  @ApiPropertyOptional({ default: false, example: false })
  @IsBoolean()
  @IsOptional()
  expressStudio?: boolean;

  @ApiPropertyOptional({ default: false, example: false })
  @IsBoolean()
  @IsOptional()
  ecofriendlyProduct?: boolean;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @IsOptional()
  errandHours?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  havePets?: boolean;

  
  @ApiPropertyOptional({ type: String, nullable: true, example: 'With the neighbour' })
  @IsString()
  @IsOptional()
  whereToPickKey?: string | null;

  @ApiPropertyOptional({ type: Number, description: '0=Sunday, 6=Saturday. For weekly/fortnightly', example: 4 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(6)
  scheduledDayOfWeek?: number;

  @ApiPropertyOptional({ type: Number, description: '1-31. For monthly', example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(31)
  scheduledDayOfMonth?: number;

  @ApiPropertyOptional({ type: String, description: 'HH:mm. For recurring bookings', example: '14:00' })
  @IsOptional()
  @IsString()
  scheduledTime?: string;

  @ApiPropertyOptional({ type: Date, description: 'For onetime bookings', example: '2025-07-10T14:00:00.000Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  scheduledDateTime?: Date;

  @ApiPropertyOptional({ example: 1, description: 'Number of months for recurring bookings (default: 1)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  subscriptionMonths?: number;
} 