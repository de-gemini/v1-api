import { 
  Controller, 
  Post, 
  Body, 
  Req,
  Get,
  UseGuards,
  Patch,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody,
  ApiProperty
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AdminRegisterDto } from './dto/admin-register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { success } from '../common/utils/response.util';
import { SuccessResponse } from '../common/dto/success-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, type: SuccessResponse })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return success(result, 'Login successful');
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, type: SuccessResponse })
  @ApiResponse({ status: 400, description: 'Bad request - email exists or passwords do not match' })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return success(result, 'Registration successful', 201);
  }

  @Post('admin/register')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  // @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin registration (Admin only)' })
  @ApiResponse({ 
    status: 201, 
    description: 'Admin registered successfully'
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async adminRegister(@Body() adminRegisterDto: AdminRegisterDto) {
    //nullify this route
    return success(adminRegisterDto, 'Admin registered successfully', 201);
    return this.authService.adminRegister(adminRegisterDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile retrieved successfully'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        phoneNumber: { type: 'string', example: '+1234567890' },
        address: { type: 'string', example: '123 Main St' },
        postcode: { type: 'string', example: 'SW1A 1AA' }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile updated successfully'
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateProfile(
    @Req() req: any,
    @Body() body: { 
      firstName?: string; 
      lastName?: string; 
      phoneNumber?: string; 
      address?: string; 
      postcode?: string; 
    }
  ) {
    return this.authService.updateProfile(req.user.id, body);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        oldPassword: { type: 'string', example: 'oldpassword123' },
        newPassword: { type: 'string', example: 'newpassword123' }
      },
      required: ['oldPassword', 'newPassword']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Password changed successfully'
  })
  @ApiResponse({ status: 400, description: 'Current password is incorrect' })
  async changePassword(
    @Req() req: any,
    @Body() body: { oldPassword: string; newPassword: string }
  ) {
    return this.authService.changePassword(req.user.id, body.oldPassword, body.newPassword);
  }
} 