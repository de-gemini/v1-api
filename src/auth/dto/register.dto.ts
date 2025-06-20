import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ 
    example: 'John Doe',
    description: 'User full name'
  })
  @IsString()
  name: string;

  @ApiProperty({ 
    example: 'user@example.com',
    description: 'User email address'
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: 'password123',
    description: 'User password (minimum 6 characters)',
    minLength: 6
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ 
    example: 'password123',
    description: 'Password confirmation (must match password)',
    minLength: 6
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  confirmPassword?: string;

  @ApiProperty({
    example: '+447911123456',
    description: 'User phone number in international format'
  })
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    example: '123 Main St, London',
    description: 'User address'
  })
  @IsString()
  address: string;
} 