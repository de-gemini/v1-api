import { Injectable } from '@nestjs/common';
import { RoomType, DirtLevel, ServiceType } from '../dto/create-booking.dto';

@Injectable()
export class PricingService {
  private readonly baseRates = {
    [ServiceType.REGULAR]: 20,
    [ServiceType.END_OF_TENANCY]: 25,
    [ServiceType.DEEP_CLEANING]: 30,
    [ServiceType.CARPET_CLEANING]: 35,
    [ServiceType.UPHOLSTERY_CLEANING]: 40,
  };

  private readonly roomTimeEstimates = {
    [RoomType.BEDROOM]: 30, // minutes
    [RoomType.LIVING_ROOM]: 45,
    [RoomType.BATHROOM]: 40,
    [RoomType.KITCHEN]: 60,
    [RoomType.HALL]: 20,
    [RoomType.OFFICE]: 30,
    [RoomType.CONSERVATORY]: 30,
    [RoomType.GARAGE]: 45,
    [RoomType.TOILET]: 20,
    [RoomType.STAIRCASE]: 25,
  };

  private readonly dirtLevelMultipliers = {
    [DirtLevel.LIGHT]: 1,
    [DirtLevel.MEDIUM]: 1.3,
    [DirtLevel.HEAVY]: 1.6,
  };

  calculateEstimatedTime(
    rooms: { type: RoomType; quantity: number }[],
    dirtLevel: DirtLevel = DirtLevel.MEDIUM,
  ): number {
    const totalMinutes = rooms.reduce((total, room) => {
      const baseTime = this.roomTimeEstimates[room.type];
      return total + (baseTime * room.quantity);
    }, 0);

    return Math.ceil(totalMinutes * this.dirtLevelMultipliers[dirtLevel] / 60);
  }

  calculateEstimatedPrice(
    serviceType: ServiceType,
    estimatedHours: number,
    dirtLevel: DirtLevel = DirtLevel.MEDIUM,
  ): number {
    const baseRate = this.baseRates[serviceType];
    const priceMultiplier = this.dirtLevelMultipliers[dirtLevel];
    
    return Math.ceil(baseRate * estimatedHours * priceMultiplier);
  }

  getMinimumPrice(serviceType: ServiceType): number {
    // Minimum 3 hours for any service
    return this.baseRates[serviceType] * 3;
  }
} 