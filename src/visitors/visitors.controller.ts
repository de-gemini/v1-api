import { Controller, Post, Get, Req, Body } from '@nestjs/common';
import { VisitorsService } from './visitors.service';

@Controller('visitors')
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) {}

  @Post('track')
  async track(@Req() req, @Body() body: { path?: string, sessionId?: string }) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const sessionId = body.sessionId;
    const path = body.path;
    await this.visitorsService.trackVisit(ip, userAgent, sessionId, path);
    return { success: true };
  }

  @Get('stats')
  async stats() {
    return this.visitorsService.getStats();
  }
} 