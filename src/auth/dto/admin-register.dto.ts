import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/schemas/user.schema';

export class AdminRegisterDto {
  @ApiProperty({ 
    example: 'Admin User',
    description: 'Admin full name'
  })
  @IsString()
  name: string;

  @ApiProperty({ 
    example: 'admin@example.com',
    description: 'Admin email address'
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: 'admin123',
    description: 'Admin password (minimum 6 characters)',
    minLength: 6
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ 
    enum: UserRole,
    example: UserRole.ADMIN,
    description: 'User role'
  })
  @IsEnum(UserRole)
  role: UserRole;
} 