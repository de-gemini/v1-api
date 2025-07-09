import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private readonly startupTime = Date.now();

  getHello(): string {
    return 'Hello World!';
  }

  getHealth(): { status: string; uptime: number; timestamp: string } {
    const uptime = Date.now() - this.startupTime;
    return {
      status: 'ok',
      uptime,
      timestamp: new Date().toISOString(),
    };
  }

  getStartupInfo(): { startupTime: number; uptime: number } {
    const uptime = Date.now() - this.startupTime;
    this.logger.log(`📊 App uptime: ${uptime}ms`);
    return {
      startupTime: this.startupTime,
      uptime,
    };
  }
}

