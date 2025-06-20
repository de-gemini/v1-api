import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document, FilterQuery, UpdateQuery, QueryOptions, Query } from 'mongoose';

@Injectable()
export abstract class BaseRepository<T extends Document> {
  constructor(protected readonly model: Model<T>) {}

  async create(data: Partial<T>): Promise<T> {
    const entity = new this.model(data);
    return await entity.save();
  }

  async findById(id: string): Promise<T | null> {
    return await this.model.findById(id).exec();
  }

  findByIdQuery(id: string): Query<T | null, T> {
    return this.model.findById(id);
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return await this.model.findOne(filter).exec();
  }

  findOneQuery(filter: FilterQuery<T>): Query<T | null, T> {
    return this.model.findOne(filter);
  }

  async find(filter: FilterQuery<T> = {}, options?: QueryOptions): Promise<T[]> {
    return await this.model.find(filter, null, options).exec();
  }

  findQuery(filter: FilterQuery<T> = {}, options?: QueryOptions): Query<T[], T> {
    return this.model.find(filter, null, options);
  }

  async findByIdAndUpdate(
    id: string,
    update: UpdateQuery<T>,
    options?: QueryOptions
  ): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, update, {
      new: true,
      ...options,
    }).exec();
  }

  findByIdAndUpdateQuery(
    id: string,
    update: UpdateQuery<T>,
    options?: QueryOptions
  ): Query<T | null, T> {
    return this.model.findByIdAndUpdate(id, update, {
      new: true,
      ...options,
    });
  }

  async findOneAndUpdate(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: QueryOptions
  ): Promise<T | null> {
    return await this.model.findOneAndUpdate(filter, update, {
      new: true,
      ...options,
    }).exec();
  }

  findOneAndUpdateQuery(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: QueryOptions
  ): Query<T | null, T> {
    return this.model.findOneAndUpdate(filter, update, {
      new: true,
      ...options,
    });
  }

  async findByIdAndDelete(id: string): Promise<T | null> {
    return await this.model.findByIdAndDelete(id).exec();
  }

  async findOneAndDelete(filter: FilterQuery<T>): Promise<T | null> {
    return await this.model.findOneAndDelete(filter).exec();
  }

  async deleteMany(filter: FilterQuery<T>): Promise<{ deletedCount: number }> {
    return await this.model.deleteMany(filter).exec();
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return await this.model.countDocuments(filter).exec();
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const result = await this.model.exists(filter).exec();
    return result !== null;
  }

  // Soft delete method
  async softDelete(id: string): Promise<T | null> {
    return await this.model.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true }
    ).exec();
  }

  // Find without soft deleted documents
  async findActive(filter: FilterQuery<T> = {}): Promise<T[]> {
    return await this.model.find({
      ...filter,
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    }).exec();
  }

  findActiveQuery(filter: FilterQuery<T> = {}): Query<T[], T> {
    return this.model.find({
      ...filter,
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    });
  }

  // Find one without soft deleted documents
  async findOneActive(filter: FilterQuery<T>): Promise<T | null> {
    return await this.model.findOne({
      ...filter,
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    }).exec();
  }

  findOneActiveQuery(filter: FilterQuery<T>): Query<T | null, T> {
    return this.model.findOne({
      ...filter,
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    });
  }

  // Pagination helper
  async findWithPagination(
    filter: FilterQuery<T> = {},
    page: number = 1,
    limit: number = 10,
    sort: any = { createdAt: -1 }
  ): Promise<{ data: T[]; total: number; page: number; limit: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.model.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
} 