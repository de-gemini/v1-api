import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AdminRegisterDto } from './dto/admin-register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService,
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
} 