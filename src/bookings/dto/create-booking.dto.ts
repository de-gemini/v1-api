import { IsString, IsNumber, IsDate, IsOptional, IsEnum, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

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
  REGULAR = 'regular',
  END_OF_TENANCY = 'end_of_tenancy',
  DEEP_CLEANING = 'deep_cleaning',
  CARPET_CLEANING = 'carpet_cleaning',
  UPHOLSTERY_CLEANING = 'upholstery_cleaning'
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
  @ApiProperty({ enum: ServiceType })
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiProperty({ type: [RoomDetails] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomDetails)
  rooms: RoomDetails[];

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsString()
  postcode: string;

  @ApiProperty({ type: Date })
  @IsDate()
  @Type(() => Date)
  scheduledDate: Date;

  @ApiProperty({ enum: DirtLevel, default: DirtLevel.MEDIUM })
  @IsEnum(DirtLevel)
  @IsOptional()
  dirtLevel: DirtLevel;

  @ApiProperty()
  @IsNumber()
  estimatedDuration: number;

  @ApiProperty()
  @IsNumber()
  estimatedPrice: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  promoCode?: string;
} 