import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../common/repositories/base.repository';
import { CleaningTime, CleaningTimeDocument } from './schemas/cleaning_time.schema';
import { CreateCleaningTimeDto } from './dto/create-cleaning-time.dto';
import { UpdateCleaningTimeDto } from './dto/update-cleaning-time.dto';
import { QueryCleaningTimeDto } from './dto/query-cleaning-time.dto';

@Injectable()
export class CleaningTimeService extends BaseRepository<CleaningTimeDocument> {
  constructor(
    @InjectModel(CleaningTime.name) private cleaningTimeModel: Model<CleaningTimeDocument>
  ) {
    super(cleaningTimeModel);
  }

  async createCleaningTime(createCleaningTimeDto: CreateCleaningTimeDto): Promise<CleaningTimeDocument> {
    // Check if room type already exists
    const existingRoom = await this.findOne({ name: createCleaningTimeDto.name });
    if (existingRoom) {
      throw new ConflictException(`Room type '${createCleaningTimeDto.name}' already exists`);
    }

    return await super.create({
      ...createCleaningTimeDto,
    });
  }

  async findAll(): Promise<CleaningTimeDocument[]> {
    return await this.findActiveQuery().sort({ name: 1 }).exec();
  }

  async findWithFilters(filters: QueryCleaningTimeDto) {
    const query: any = new Object() ;

    if (filters.name) {
      query.name = { $regex: filters.name, $options: 'i' };
    }

    
    if (filters.minTime || filters.maxTime) {
      query.cleaningTime = {};
      if (filters.minTime) query.cleaningTime.$gte = filters.minTime;
      if (filters.maxTime) query.cleaningTime.$lte = filters.maxTime;
    }

    if (filters.page || filters.limit) {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const sort = { name: 1 };
      return await this.findWithPagination(query, page, limit, sort);
    }
    
    const data = await this.findQuery(query).sort({ name: 1 }).exec();
    return {
      data,
      total: data.length,
      page: 1,
      limit: data.length,
      totalPages: 1,
    };
  }

  async findOneById(id: string): Promise<CleaningTimeDocument> {
    const cleaningTime = await super.findById(id);
    if (!cleaningTime ) {
      throw new NotFoundException('Cleaning time not found');
    }
    return cleaningTime;
  }

  async findByName(name: string): Promise<CleaningTimeDocument> {
    const cleaningTime = await this.findOne({ name: { $regex: name, $options: 'i' } });
    if (!cleaningTime ) {
      throw new NotFoundException(`Cleaning time for '${name}' not found`);
    }
    return cleaningTime;
  }

  async updateCleaningTime(id: string, updateCleaningTimeDto: UpdateCleaningTimeDto): Promise<CleaningTimeDocument> {
    // Check if the cleaning time exists
    const existing = await super.findById(id);
    if (!existing ) {
      throw new NotFoundException('Cleaning time not found');
    }

    // If name is being updated, check for conflicts
    if (updateCleaningTimeDto.name && updateCleaningTimeDto.name !== existing.name) {
      const nameConflict = await this.findOne({ name: updateCleaningTimeDto.name });
      if (nameConflict) {
        throw new ConflictException(`Room type '${updateCleaningTimeDto.name}' already exists`);
      }
    }

    const updated = await super.findByIdAndUpdate(id, updateCleaningTimeDto);
    if (!updated) {
      throw new NotFoundException('Cleaning time not found');
    }
    return updated;
  }

  async deleteCleaningTime(id: string): Promise<void> {
    const cleaningTime = await super.findByIdAndUpdate(id, { deletedAt: Date.now() });
    if (!cleaningTime) {
      throw new NotFoundException('Cleaning time not found');
    }
  }

  async findByDifficulty(difficulty: string): Promise<CleaningTimeDocument[]> {
    return await this.findQuery({ difficulty, isActive: true }).sort({ name: 1 }).exec();
  }

  async calculateTotalTime(rooms: { name: string; quantity: number }[]): Promise<number> {
    let totalTime = 0;
    
    for (const room of rooms) {
      const cleaningTime = await this.findOne({ name: room.name });
      if (cleaningTime ) {
        totalTime += cleaningTime.cleaningTime * room.quantity;
      }
    }
    
    return totalTime;
  }

  async getRoomTypes(): Promise<{ name: string; cleaningTime: number; }[]> {
    const cleaningTimes = await this.findActiveQuery().sort({ name: 1 }).exec();
    return cleaningTimes.map(ct => ({
      name: ct.name,
      cleaningTime: ct.cleaningTime,
    }));
  }
} 