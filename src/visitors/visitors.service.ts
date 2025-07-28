import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Visitor, VisitorDocument } from './schemas/visitor.schema';

@Injectable()
export class VisitorsService {
  constructor(
    @InjectModel(Visitor.name) private visitorModel: Model<VisitorDocument>,
  ) {}

  async trackVisit(ip: string, userAgent?: string, sessionId?: string, path?: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    console.log(`🔍 [trackVisit] Tracking visit:`, {
      ip,
      sessionId,
      path,
      startOfDay: startOfDay.toISOString()
    });
    
    try {
      // First, check if we already have a record for this session and path today
      const existingRecord = await this.visitorModel.findOne({
        sessionId,
        path,
        createdAt: { $gte: startOfDay }
      });

      if (existingRecord) {
        console.log(`📝 [trackVisit] Record already exists for session ${sessionId} and path ${path} today`);
        return existingRecord;
      }

      // Create new record if none exists
      const newRecord = new this.visitorModel({
        ip,
        userAgent,
        sessionId,
        path,
        createdAt: new Date()
      });

      const result = await newRecord.save();
      console.log(`✅ [trackVisit] Created new visitor record:`, result._id);
      return result;
      
    } catch (error) {
      console.error(`❌ [trackVisit] Error tracking visit:`, error);
      throw error;
    }
  }

  async getStats() {
    const now = new Date();
    const startOfToday = new Date(now); startOfToday.setHours(0,0,0,0);
    const startOfYesterday = new Date(startOfToday); startOfYesterday.setDate(startOfToday.getDate() - 1);
    const startOf7Days = new Date(now); startOf7Days.setDate(now.getDate() - 6); startOf7Days.setHours(0,0,0,0);
    const startOf30Days = new Date(now); startOf30Days.setDate(now.getDate() - 29); startOf30Days.setHours(0,0,0,0);

    const [today, yesterday, last7, last30] = await Promise.all([
      this.visitorModel.distinct('sessionId', { createdAt: { $gte: startOfToday } }),
      this.visitorModel.distinct('sessionId', { createdAt: { $gte: startOfYesterday, $lt: startOfToday } }),
      this.visitorModel.distinct('sessionId', { createdAt: { $gte: startOf7Days } }),
      this.visitorModel.distinct('sessionId', { createdAt: { $gte: startOf30Days } }),
    ]);
    return {
      today: today.length,
      yesterday: yesterday.length,
      last7: last7.length,
      last30: last30.length,
    };
  }
} 