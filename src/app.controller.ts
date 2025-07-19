import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): { status: string; uptime: number; timestamp: string } {
    return this.appService.getHealth();
  }

  
  @Get('startup-info')
  getStartupInfo(): { startupTime: number; uptime: number } {
    return this.appService.getStartupInfo();
  }
}
