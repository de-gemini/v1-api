import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PostcodeDto {
  @ApiProperty({ example: 'PE1 1AA', description: 'Postcode to check' })
  @IsString()
  postcode: string;
} 