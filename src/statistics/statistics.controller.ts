import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Admin Statistics')
@Controller('admin/statistics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('total-bookings')
  @ApiOperation({ summary: 'Get total number of bookings' })
  async getTotalBookings() {
    return { total: await this.statisticsService.getTotalBookings() };
  }

  @Get('completed-bookings')
  @ApiOperation({ summary: 'Get total number of completed bookings' })
  async getCompletedBookings() {
    return { total: await this.statisticsService.getCompletedBookings() };
  }

  @Get('pending-bookings')
  @ApiOperation({ summary: 'Get total number of pending/upcoming bookings' })
  async getPendingBookings() {
    return { total: await this.statisticsService.getPendingBookings() };
  }

  @Get('total-revenue')
  @ApiOperation({ summary: 'Get total revenue from completed bookings' })
  async getTotalRevenue() {
    return { total: await this.statisticsService.getTotalRevenue() };
  }

  @Get('new-customers')
  @ApiOperation({ summary: 'Get number of new customers since start of month' })
  async getNewCustomers() {
    const now = new Date();
    const since = new Date(now.getFullYear(), now.getMonth(), 1);
    return { total: await this.statisticsService.getNewCustomers(since) };
  }

  @Get('recent-bookings')
  @ApiOperation({ summary: 'Get recent bookings' })
  async getRecentBookings(@Query('limit') limit = 10) {
    return { bookings: await this.statisticsService.getRecentBookings(Number(limit)) };
  }

  @Get('top-customers')
  @ApiOperation({ summary: 'Get top customers by booking count' })
  async getTopCustomers(@Query('limit') limit = 5) {
    return { customers: await this.statisticsService.getTopCustomers(Number(limit)) };
  }

  @Get('top-services')
  @ApiOperation({ summary: 'Get most popular services' })
  async getTopServices(@Query('limit') limit = 5) {
    return { services: await this.statisticsService.getTopServices(Number(limit)) };
  }

  @Get('upcoming-bookings')
  @ApiOperation({ summary: 'Get upcoming bookings' })
  async getUpcomingBookings(@Query('limit') limit = 10) {
    return { bookings: await this.statisticsService.getUpcomingBookings(Number(limit)) };
  }
} 