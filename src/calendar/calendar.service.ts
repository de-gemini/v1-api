import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CalendarAvailability, CalendarAvailabilityDocument } from './calendar.schema';
import { CreateCalendarAvailabilityDto } from './dto/create-calendar-availability.dto';
import { UpdateCalendarAvailabilityDto } from './dto/update-calendar-availability.dto';

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate(); // month is 1-based
}

@Injectable()
export class CalendarService {
  constructor(
    @InjectModel(CalendarAvailability.name)
    private readonly calendarModel: Model<CalendarAvailabilityDocument>,
  ) {}

  async create(dto: CreateCalendarAvailabilityDto): Promise<CalendarAvailability | null> {
    const exists = await this.calendarModel.findOne({ year: dto.year, month: dto.month, day: dto.day });
    if (exists) {
      if (dto.available === true) {
        // If making available again, delete the record
        await this.calendarModel.deleteOne({ _id: exists._id });
        return null;
      } else {
        // If making unavailable, update the record
        exists.available = false;
        if (dto.note !== undefined) exists.note = dto.note;
        await exists.save();
        return exists;
      }
    } else {
      // If not exists and available is false, create the record
      if (dto.available === false) {
        return this.calendarModel.create(dto);
      } else {
        // If not exists and available is true, do nothing (default is available)
        return null;
      }
    }
  }

  async update(id: string, dto: UpdateCalendarAvailabilityDto): Promise<CalendarAvailability> {
    const updated = await this.calendarModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException('Day not found');
    return updated;
  }

  async toggleAvailability(id: string, available: boolean): Promise<CalendarAvailability> {
    const updated = await this.calendarModel.findByIdAndUpdate(id, { available }, { new: true });
    if (!updated) throw new NotFoundException('Day not found');
    return updated;
  }

  async findByMonth(year: number, month: number): Promise<{ day: number; available: boolean; note?: string }[]> {
    const today = new Date();
    const nowYear = today.getFullYear();
    const nowMonth = today.getMonth() + 1; // JS months are 0-based
    const nowDate = today.getDate();
    const days = daysInMonth(year, month);
    const configs = await this.calendarModel.find({ year, month }).exec();
    const configMap = new Map<number, CalendarAvailabilityDocument>();
    configs.forEach(cfg => configMap.set(cfg.day, cfg));
    const result: { day: number; available: boolean; note?: string }[] = [];
    for (let d = 1; d <= days; d++) {
      // Past date check
      let isPast = false;
      if (year < nowYear) isPast = true;
      else if (year === nowYear && month < nowMonth) isPast = true;
      else if (year === nowYear && month === nowMonth && d < nowDate) isPast = true;
      if (isPast) {
        result.push({ day: d, available: false });
        continue;
      }
      const config = configMap.get(d);
      if (config) {
        result.push({ day: d, available: !!config.available, note: config.note });
      } else {
        result.push({ day: d, available: true });
      }
    }
    return result;
  }

  async findOne(year: number, month: number, day: number): Promise<CalendarAvailability | null> {
    return this.calendarModel.findOne({ year, month, day });
  }

  async findAll(): Promise<CalendarAvailability[]> {
    return this.calendarModel.find().sort({ year: 1, month: 1, day: 1 }).exec();
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.calendarModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Day not found');
  }
} 