import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { MailService } from './mail/mail.service';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
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

  @Get('email-config')
  getEmailConfig() {
    this.logger.log('🔍 Email configuration check requested');
    
    const config = {
      MAIL_HOST: this.configService.get('MAIL_HOST'),
      MAIL_USER: this.configService.get('MAIL_USER'),
      MAIL_PASSWORD: this.configService.get('MAIL_PASSWORD') ? '***configured***' : 'NOT SET',
      MAIL_FROM: this.configService.get('MAIL_FROM'),
      NODE_ENV: this.configService.get('NODE_ENV'),
    };
    
    this.logger.log('📧 Email configuration:');
    Object.entries(config).forEach(([key, value]) => {
      this.logger.log(`  ${key}: ${value}`);
    });
    
    const allConfigured = config.MAIL_HOST && config.MAIL_USER && 
                         this.configService.get('MAIL_PASSWORD') && config.MAIL_FROM;
    
    return {
      configured: allConfigured,
      config: config,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('test-email')
  async testEmail(@Body() body: { to: string; name?: string }) {
    this.logger.log('📧 Test email endpoint called');
    this.logger.log(`📋 Request body: ${JSON.stringify(body, null, 2)}`);
    this.logger.log(`📧 Recipient: ${body.to}`);
    this.logger.log(`👤 Name: ${body.name || 'Test User'}`);
    
    try {
      this.logger.log('🔄 Calling mail service...');
      
      // Send a simple test email
      await this.mailService.sendTestEmail(body.to, body.name || 'Test User');
      
      this.logger.log('✅ Email sent successfully from controller');
      
      return {
        success: true,
        message: 'Test email sent successfully!',
        sentTo: body.to,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('❌ Email sending failed in controller');
      this.logger.error(`🚨 Error: ${error.message}`);
      this.logger.error(`🚨 Stack: ${error.stack}`);
      
      return {
        success: false,
        message: 'Failed to send test email',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
