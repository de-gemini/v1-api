import { Controller, Post, Body, Get, Query, UseGuards, Req, Param, Patch, Delete, NotFoundException, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { PricingService } from './services/pricing.service';
import { CreateBookingDto, ServiceType, RoomType, DirtLevel } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { success } from '../common/utils/response.util';
import { SuccessResponse } from '../common/dto/success-response.dto';
import { PaymentStatus } from '../common/constants/payment-status.enum';

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
  ) {
    console.log('🔍 [DEBUG] BookingsController initialized');
  }

  @Get('test')
  @ApiOperation({ summary: 'Test endpoint' })
  test() {
    console.log('🔍 [DEBUG] Test endpoint called');
    return { message: 'Bookings controller is working' };
  }

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
    console.log('🔍 [DEBUG] findOne called with id:', id, 'user:', req.user?.id || 'NO USER');
    console.log('🔍 [DEBUG] Full request object:', JSON.stringify(req.user, null, 2));
    const booking = await this.bookingsService.findOneByUser(req.user.id, id);
    return success(booking, 'Booking fetched successfully');
  }

  @Get('client-schedules/all')
  @ApiOperation({ summary: 'Get all schedules for the authenticated user' })
  @ApiResponse({ status: 200, type: SuccessResponse })
  async getUserSchedules(@Req() req: any) {
    const schedules = await this.bookingsService.getUserSchedules(req.user.id);
    return success(schedules, 'User schedules fetched successfully');
  }

  @Get('schedules/:id')
  @ApiOperation({ summary: 'Get a specific schedule by ID' })
  @ApiResponse({ status: 200, type: SuccessResponse })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async getSchedule(@Param('id') id: string, @Req() req: any) {
    console.log('🔍 [DEBUG] getSchedule called with id:', id);
    const schedule = await this.bookingsService.getScheduleById(id);
    return success(schedule, 'Schedule fetched successfully');
  }

  @Patch('schedules/:id')
  @ApiOperation({ summary: 'Update schedule status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Schedule status updated successfully'
  })

  // @Get('schedules/stats')
  // @ApiOperation({ summary: 'Get schedule statistics for the authenticated user' })
  // @ApiResponse({ status: 200, type: SuccessResponse })
  // async getScheduleStats(
  //   @Req() req: any,
  //   @Query('year') year?: string,
  //   @Query('month') month?: string
  // ) {
  //   const filter = year && month ? { year, month } : undefined;
  //   const stats = await this.bookingsService.getUserScheduleStats(req.user.id, filter);
  //   return success(stats, 'Schedule statistics fetched successfully');
  // }


  
  

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

  @Patch('admin/schedule/:id/payment-status')
  @ApiOperation({ summary: 'Admin: Update schedule payment status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Schedule payment status updated successfully'
  })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async updateSchedulePaymentStatus(
    @Param('id') id: string,
    @Body() body: { paymentStatus: 'pending' | 'completed' | 'failed' }
  ) {
    const updatedSchedule = await this.bookingsService.updateSchedulePaymentStatus(id, body.paymentStatus);
    return success(updatedSchedule, 'Schedule payment status updated successfully');
  }
} 





@ApiTags('Bookings2')
@Controller('bookings2')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController2 {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly pricingService: PricingService,
  ) {
    console.log('🔍 [DEBUG] BookingsController initialized');
  }



@Patch('/cash-pay/:id/payment-method')
  @ApiOperation({ summary: 'Update booking payment method' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment method updated successfully'
  })
  async updatePaymentMethod(
    @Param('id') id: string,
    @Body() body: { paymentMethod: 'card' | 'cash' },
    @Req() req: any,
  ) {
    console.log("here")
    const updated = await this.bookingsService.updatePaymentMethod(id, body.paymentMethod, req.user.id);
    return success(updated, 'Payment method updated successfully');
  }

}