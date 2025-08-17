import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AdminRegisterDto } from './dto/admin-register.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Otp, OtpDocument } from './schemas/otp.schema';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService,
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    private readonly mailService: MailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmailActive(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.usersService.updateLastLogin(user._id);

    const payload = { 
      email: user.email, 
      sub: user._id,
      role: user.role 
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phoneNumber:user.phoneNumber,
        address:user.address,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // Validate password confirmation
    if (registerDto.confirmPassword && registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.createUser({
      name: registerDto.name,
      email: registerDto.email,
      phoneNumber:registerDto.phoneNumber,
      address:registerDto.address,
      password: hashedPassword,
      role: UserRole.USER, // Default role for normal registration
    });

    const { password, ...result } = user.toObject();
    return result;
  }

  async adminRegister(adminRegisterDto: AdminRegisterDto) {
    const existingUser = await this.usersService.findByEmail(adminRegisterDto.email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(adminRegisterDto.password, 10);
    const user = await this.usersService.createUser({
      name: adminRegisterDto.name,
      email: adminRegisterDto.email,
      password: hashedPassword,
      role: adminRegisterDto.role,
    });

    const { password, ...result } = user.toObject();
    return result;
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, ...result } = user.toObject();
    return result;
  }

  async updateProfile(userId: string, profileData: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    address?: string;
    postcode?: string;
  }) {
    const user = await this.usersService.updateUser(userId, profileData);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, ...result } = user.toObject();
    return result;
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updateUser(userId, { password: hashedNewPassword });

    return { message: 'Password changed successfully' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    
    // Check if user exists
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Delete any existing OTP for this email
    await this.otpModel.deleteOne({ email });
    
    // Create new OTP record
    await this.otpModel.create({
      email,
      otp,
    });

    // Send OTP email
    try {
      await this.mailService.sendOtpEmail(user, otp);
    } catch (error) {
      // Delete OTP if email fails
      await this.otpModel.deleteOne({ email });
      throw new BadRequestException('Failed to send OTP email');
    }

    return { message: 'OTP sent to your email' };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, otp } = verifyOtpDto;
    
    // Find OTP record
    const otpRecord = await this.otpModel.findOne({ email, otp });
    if (!otpRecord) {
      throw new BadRequestException('Invalid OTP');
    }

    // Check if OTP is expired (handled by MongoDB TTL)
    if (otpRecord.createdAt < new Date(Date.now() - 5 * 60 * 1000)) {
      await this.otpModel.deleteOne({ email });
      throw new BadRequestException('OTP has expired');
    }

    // Delete OTP after successful verification
    await this.otpModel.deleteOne({ email });

    return { message: 'OTP verified successfully' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, newPassword } = resetPasswordDto;
    
    // Check if user exists
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user password
    await this.usersService.updateUser(user._id, { password: hashedPassword });

    return { message: 'Password reset successfully' };
  }
} 