import { Controller, Post, Body, Get, Query, UseGuards, Req, Param, Patch, Delete, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { PricingService } from './services/pricing.service';
import { CreateBookingDto, ServiceType, RoomType, DirtLevel } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { success } from '../common/utils/response.util';
import { SuccessResponse } from '../common/dto/success-response.dto';

interface TimeSlot {
  time: string;
  available: boolean;
}

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
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
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, type: SuccessResponse })
  async create(@Body() createBookingDto: CreateBookingDto, @Req() req: any) {
    // console.log(req.headers)
    const created = await this.bookingsService.createBooking(req.user.id, createBookingDto);
    return success(created, 'Booking created successfully', 201);
  }


  @Get()
  @ApiOperation({ summary: 'Get all bookings for the authenticated user' })
  @ApiResponse({ status: 200, type: SuccessResponse })
  async findAll(@Req() req: any) {
    const bookings = await this.bookingsService.findAll(req.user.id);
    return success(bookings, 'Bookings fetched successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific booking by ID' })
  @ApiResponse({ status: 200, type: SuccessResponse })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const booking = await this.bookingsService.findOneByUser(req.user.id, id);
    return success(booking, 'Booking fetched successfully');
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update booking status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Booking status updated successfully'
  })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Req() req: any,
  ) {
    return this.bookingsService.updateStatus(id, body.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a booking' })
  @ApiResponse({ 
    status: 200, 
    description: 'Booking deleted successfully'
  })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.bookingsService.delete(req.user.id, id);
  }

  // @Get('availability')
  // @ApiOperation({ summary: 'Check available time slots for a specific date' })
  // async checkAvailability(
  //   @Query('date') date: string,
  //   @Query('postcode') postcode: string,
  // ) {
  //   const availableSlots: TimeSlot[] = [];
  //   const startHour = 8;
  //   const endHour = 18;

  //   for (let hour = startHour; hour <= endHour; hour++) {
  //     availableSlots.push({
  //       time: `${hour}:00`,
  //       available: true,
  //     });
  //   }

  //   return {
  //     date,
  //     postcode,
  //     availableSlots,
  //   };
  // }

  // @Get('service-types')
  // @ApiOperation({ summary: 'Get all available service types and their base rates' })
  // getServiceTypes() {
  //   return {
  //     services: Object.values(ServiceType).map(type => ({
  //       type,
  //       baseRate: this.pricingService.getMinimumPrice(type) / 3, // Per hour rate
  //       minimumHours: 3,
  //     })),
  //   };
  // }

  // @Get('room-types')
  // @ApiOperation({ summary: 'Get all available room types and their time estimates' })
  // getRoomTypes() {
  //   return {
  //     rooms: Object.values(RoomType).map(type => ({
  //       type,
  //       estimatedMinutes: 30, // This would come from pricing service in real app
  //     })),
  //   };
  // }

  @Get('/admin/schedules')
  @ApiOperation({ summary: 'Get all booking schedules (admin, filterable by month)' })
  @ApiResponse({ status: 200, type: SuccessResponse })
  async getAllSchedules(
    @Query('year') year?: string,
    @Query('month') month?: string
  ) {
    if ((year && !month) || (!year && month)) {
      return { statusCode: 400, message: 'Both year and month are required for filtering.' };
    }
    const filter = year && month ? { year, month } : undefined;
    const schedules = await this.bookingsService.getAllSchedulesWithDetails(filter);
    return success(schedules, 'All schedules fetched successfully');
  }

  @Patch('admin/schedule/:id/status')
  @ApiOperation({ summary: 'Admin: Update schedule status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Schedule status updated successfully'
  })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async updateScheduleStatus(
    @Param('id') id: string,
    @Body() body: { status: 'pending' | 'confirmed' | 'completed' | 'cancelled' }
  ) {
    const updatedSchedule = await this.bookingsService.updateScheduleStatus(id, body.status);
    return success(updatedSchedule, 'Schedule status updated successfully');
  }
} 