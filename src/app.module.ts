import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BookingsModule } from './bookings/bookings.module';
import { MailModule } from './mail/mail.module';
import { PaymentsModule } from './payments/payments.module';
import { CleaningTimeModule } from './cleaning_time/cleaning_time.module';
import { CalendarModule } from './calendar/calendar.module';
import { join } from 'path';
import { PostcodeController } from './common/postcode.controller';
import { StatisticsModule } from './statistics/statistics.module';
import { VisitorsModule } from './visitors/visitors.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('MongoDB');
        const startTime = Date.now();
        logger.log('🗄️ Initializing MongoDB connection...');
        
        const uri = configService.get<string>('MONGODB_URI');
        if (!uri) {
          logger.error('❌ MONGODB_URI environment variable is not set!');
          throw new Error('MONGODB_URI is required');
        }
        
        logger.log(`✅ MongoDB URI configured, connection will be established on first use`);
        return { uri };
      },
      inject: [ConfigService],
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const logger = new Logger('Mailer');
        const startTime = Date.now();
        logger.log('📧 Initializing mailer configuration...');
        
        const mailHost = config.get('MAIL_HOST');
        const mailUser = config.get('MAIL_USER');
        const mailPassword = config.get('MAIL_PASSWORD');
        const mailFrom = config.get('MAIL_FROM');
        
        if (!mailHost || !mailUser || !mailPassword || !mailFrom) {
          logger.warn('⚠️ Some mail configuration is missing - email functionality may not work');
        } else {
          logger.log('✅ Mail configuration complete');
        }
        
        return {
          transport: {
            host: mailHost,
            secure: true,
            auth: {
              user: mailUser,
              pass: mailPassword,
            },
          },
          defaults: {
            from: mailFrom,
          },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('JWT');
        logger.log('🔐 Initializing JWT configuration...');
        
        const secret = configService.get('JWT_SECRET');
        if (!secret) {
          logger.error('❌ JWT_SECRET environment variable is not set!');
          throw new Error('JWT_SECRET is required');
        }
        
        logger.log('✅ JWT configuration complete');
        return {
          secret,
          signOptions: {
            expiresIn: configService.get('JWT_EXPIRATION', '1d'),
          },
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    BookingsModule,
    MailModule,
    PaymentsModule.forRootAsync({
      imports: [ConfigModule, BookingsModule, MailModule],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('Payments');
        logger.log('💳 Initializing Stripe payments configuration...');
        
        const apiKey = configService.get<string>('STRIPE_SECRET_KEY', '');
        const webhookSecret = configService.get<string>('STRIPE_WEBHOOK_SECRET', '');
        
        if (!apiKey) {
          logger.warn('⚠️ STRIPE_SECRET_KEY not configured - payment functionality will be limited');
        } else {
          logger.log('✅ Stripe configuration complete');
        }
        
        return {
          apiKey,
          webhookSecret,
          apiVersion: '2025-05-28.basil',
        };
      },
      inject: [ConfigService],
    }),
    CleaningTimeModule,
    CalendarModule,
    StatisticsModule,
    VisitorsModule,
  ],
  controllers: [AppController, PostcodeController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger('AppModule');

  onModuleInit() {
    this.logger.log('🎉 All modules initialized successfully!');
    this.logger.log('📊 Module initialization summary:');
    this.logger.log('   ✅ ConfigModule - Environment configuration');
    this.logger.log('   ✅ MongooseModule - Database connection');
    this.logger.log('   ✅ MailerModule - Email service');
    this.logger.log('   ✅ JwtModule - Authentication');
    this.logger.log('   ✅ AuthModule - User authentication');
    this.logger.log('   ✅ UsersModule - User management');
    this.logger.log('   ✅ BookingsModule - Booking management');
    this.logger.log('   ✅ MailModule - Email templates');
    this.logger.log('   ✅ PaymentsModule - Stripe integration');
    this.logger.log('   ✅ CleaningTimeModule - Service timing');
    this.logger.log('   ✅ CalendarModule - Availability management');
  }
}
