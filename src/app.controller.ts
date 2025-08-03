import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { MailService } from './mail/mail.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly mailService: MailService,
  ) {}

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

  @Post('test-email')
  async testEmail(@Body() body: { to: string; name?: string }) {
    try {
      // Send a simple test email
      await this.mailService.sendTestEmail(body.to, body.name || 'Test User');
      
      return {
        success: true,
        message: 'Test email sent successfully!',
        sentTo: body.to,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send test email',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
