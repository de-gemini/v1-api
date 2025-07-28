import { Controller, Post, Get, Req, Body } from '@nestjs/common';
import { VisitorsService } from './visitors.service';

@Controller('visitors')
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) {}

  @Post('track')
  async track(@Req() req, @Body() body: { path?: string, sessionId?: string }) {
    // Extract real client IP from various headers
    const getClientIP = (req: any): string => {
      // Check for Cloudflare, AWS, or other proxy headers
      const cfConnectingIP = req.headers['cf-connecting-ip'];
      if (cfConnectingIP) return cfConnectingIP;

      // Check for X-Forwarded-For (take the first IP)
      const xForwardedFor = req.headers['x-forwarded-for'];
      if (xForwardedFor) {
        // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
        const firstIP = xForwardedFor.split(',')[0].trim();
        return firstIP;
      }

      // Check for X-Real-IP
      const xRealIP = req.headers['x-real-ip'];
      if (xRealIP) return xRealIP;

      // Fallback to connection remote address
      return req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    };

    const ip = getClientIP(req);
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