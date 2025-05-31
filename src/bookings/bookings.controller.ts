import { Controller, Post, Body, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { PricingService } from './services/pricing.service';
import { CreateBookingDto, ServiceType, RoomType, DirtLevel } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface TimeSlot {
  time: string;
  available: boolean;
}

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly pricingService: PricingService,
  ) {}

  @Post('calculate-estimate')
  @ApiOperation({ summary: 'Calculate estimated time and price for cleaning' })
  calculateEstimate(
    @Body() data: {
      serviceType: ServiceType;
      rooms: { type: RoomType; quantity: number }[];
      dirtLevel?: DirtLevel;
    },
  ) {
    const estimatedHours = this.pricingService.calculateEstimatedTime(
      data.rooms,
      data.dirtLevel,
    );

    const estimatedPrice = this.pricingService.calculateEstimatedPrice(
      data.serviceType,
      estimatedHours,
      data.dirtLevel,
    );

    const minimumPrice = this.pricingService.getMinimumPrice(data.serviceType);

    return {
      estimatedHours,
      estimatedPrice,
      minimumPrice,
      currency: 'GBP',
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new booking' })
  async createBooking(@Req() req: any, @Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(req.user.id, createBookingDto);
  }

  @Get('availability')
  @ApiOperation({ summary: 'Check available time slots for a specific date' })
  async checkAvailability(
    @Query('date') date: string,
    @Query('postcode') postcode: string,
  ) {
    const availableSlots: TimeSlot[] = [];
    const startHour = 8;
    const endHour = 18;

    for (let hour = startHour; hour <= endHour; hour++) {
      availableSlots.push({
        time: `${hour}:00`,
        available: true,
      });
    }

    return {
      date,
      postcode,
      availableSlots,
    };
  }

  @Get('service-types')
  @ApiOperation({ summary: 'Get all available service types and their base rates' })
  getServiceTypes() {
    return {
      services: Object.values(ServiceType).map(type => ({
        type,
        baseRate: this.pricingService.getMinimumPrice(type) / 3, // Per hour rate
        minimumHours: 3,
      })),
    };
  }

  @Get('room-types')
  @ApiOperation({ summary: 'Get all available room types and their time estimates' })
  getRoomTypes() {
    return {
      rooms: Object.values(RoomType).map(type => ({
        type,
        estimatedMinutes: 30, // This would come from pricing service in real app
      })),
    };
  }
} 