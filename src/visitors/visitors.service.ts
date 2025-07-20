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
    const exists = await this.visitorModel.findOne({
      ip,
      sessionId,
      createdAt: { $gte: startOfDay }
    });
    if (!exists) {
      await this.visitorModel.create({ ip, userAgent, sessionId, path });
    }
  }

  async getStats() {
    const now = new Date();
    const startOfToday = new Date(now); startOfToday.setHours(0,0,0,0);
    const startOfYesterday = new Date(startOfToday); startOfYesterday.setDate(startOfToday.getDate() - 1);
    const startOf7Days = new Date(now); startOf7Days.setDate(now.getDate() - 6); startOf7Days.setHours(0,0,0,0);
    const startOf30Days = new Date(now); startOf30Days.setDate(now.getDate() - 29); startOf30Days.setHours(0,0,0,0);

    const [today, yesterday, last7, last30] = await Promise.all([
      this.visitorModel.distinct('ip', { createdAt: { $gte: startOfToday } }),
      this.visitorModel.distinct('ip', { createdAt: { $gte: startOfYesterday, $lt: startOfToday } }),
      this.visitorModel.distinct('ip', { createdAt: { $gte: startOf7Days } }),
      this.visitorModel.distinct('ip', { createdAt: { $gte: startOf30Days } }),
    ]);
    return {
      today: today.length,
      yesterday: yesterday.length,
      last7: last7.length,
      last30: last30.length,
    };
  }
} 