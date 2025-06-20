import { Controller, Post, Body, Patch, Param, Delete, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { CreateCalendarAvailabilityDto } from './dto/create-calendar-availability.dto';
import { UpdateCalendarAvailabilityDto } from './dto/update-calendar-availability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { success } from '../common/utils/response.util';
import { SuccessResponse } from '../common/dto/success-response.dto';

@ApiTags('Calendar Availability')
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Set availability for a day' })
  @ApiResponse({ status: 201, type: SuccessResponse })
  async create(@Body() dto: CreateCalendarAvailabilityDto) {
    const result = await this.calendarService.create(dto);
    return success(result, 'Availability set for day', 201);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Update availability for a day' })
  @ApiResponse({ status: 200, type: SuccessResponse })
  async update(@Param('id') id: string, @Body() dto: UpdateCalendarAvailabilityDto) {
    const result = await this.calendarService.update(id, dto);
    return success(result, 'Availability updated');
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Toggle availability for a day' })
  @ApiResponse({ status: 200, type: SuccessResponse })
  async toggle(@Param('id') id: string, @Body('available') available: boolean) {
    const result = await this.calendarService.toggleAvailability(id, available);
    return success(result, 'Availability toggled');
  }

  @Get('month')
  @ApiOperation({ summary: 'Get availability for a month' })
  @ApiResponse({ status: 200, type: SuccessResponse })
  async findByMonth(@Query('year') year: number, @Query('month') month: number) {
    const result = await this.calendarService.findByMonth(Number(year), Number(month));
    return success(result, 'Availability for month fetched');
  }

  @Get(':year/:month/:day')
  @ApiOperation({ summary: 'Get availability for a specific day' })
  @ApiResponse({ status: 200, type: SuccessResponse })
  async findOne(@Param('year') year: number, @Param('month') month: number, @Param('day') day: number) {
    const result = await this.calendarService.findOne(Number(year), Number(month), Number(day));
    return success(result, 'Availability for day fetched');
  }

  @Get()
  @ApiOperation({ summary: 'Get all availability records' })
  @ApiResponse({ status: 200, type: SuccessResponse })
  async findAll() {
    const result = await this.calendarService.findAll();
    return success(result, 'All availability records fetched');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Remove availability for a day' })
  @ApiResponse({ status: 204, type: SuccessResponse })
  async remove(@Param('id') id: string) {
    await this.calendarService.remove(id);
    return success(null, 'Availability removed', 204);
  }
} 