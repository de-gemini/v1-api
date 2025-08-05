import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../common/repositories/base.repository';
import { User, UserDocument, UserRole } from './schemas/user.schema';

@Injectable()
export class UsersService extends BaseRepository<UserDocument> {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {
    super(userModel);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return await this.findOne({ email });
  }

  async findByEmailActive(email: string): Promise<UserDocument | null> {
    return await this.findOneActive({ email, isActive: true });
  }

  async findAdmins(): Promise<UserDocument[]> {
    return await this.find({ role: UserRole.ADMIN, isActive: true });
  }

  async findUsers(): Promise<UserDocument[]> {
    return await this.find({ role: UserRole.USER, isActive: true });
  }

  async createUser(userData: Partial<User>): Promise<UserDocument> {
    if (!userData.email) {
      throw new ConflictException('Email is required');
    }
    
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    return await super.create(userData);
  }

  async updateUser(id: string, userData: Partial<User>): Promise<UserDocument | null> {
    if (userData.email) {
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser && existingUser._id.toString() !== id) {
        throw new ConflictException('Email already exists');
      }
    }
    // Concatenate firstName and lastName to update the name field if either is present
    if ('firstName' in userData || 'lastName' in userData) {
      // Fetch the current user to get existing values
      const currentUser = await this.findById(id);
      if (currentUser) {
        const firstName = userData.firstName !== undefined ? userData.firstName : currentUser.firstName || '';
        const lastName = userData.lastName !== undefined ? userData.lastName : currentUser.lastName || '';
        userData.name = `${firstName} ${lastName}`.trim();
      }
    }
    return await super.findByIdAndUpdate(id, userData);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await super.findByIdAndUpdate(userId, { lastLoginAt: new Date() });
  }

  async deactivateUser(userId: string): Promise<UserDocument | null> {
    return await super.findByIdAndUpdate(userId, { isActive: false });
  }

  async activateUser(userId: string): Promise<UserDocument | null> {
    return await super.findByIdAndUpdate(userId, { isActive: true });
  }

  async changeUserRole(userId: string, role: UserRole): Promise<UserDocument | null> {
    return await super.findByIdAndUpdate(userId, { role });
  }
} 