import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  // Start timing the bootstrap process
  const startTime = Date.now();
  logger.log('🚀 Starting NestJS application bootstrap...');
  
  try {
    logger.log('📦 Creating NestJS application instance...');
    const appStartTime = Date.now();
    const app = await NestFactory.create(AppModule, {
      logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });
    logger.log(`✅ NestJS app created in ${Date.now() - appStartTime}ms`);

    // Enable raw body for Stripe webhook
    logger.log('🔧 Configuring Stripe webhook body parser...');
    app.use('/payments/webhook', bodyParser.raw({ type: 'application/json' }));

    // Request logging middleware
    logger.log('🔧 Setting up request logging middleware...');
    app.use((req, res, next) => {
      const logger = new Logger('HTTP');
      const { method, originalUrl } = req;
      const start = Date.now();
      // const authHeader = req.headers['authorization'];
      // console.log('[TOKEN LOG] Authorization:', authHeader);
      res.on('finish', () => {
        const ms = Date.now() - start;
        logger.log(`${method} ${originalUrl} ${res.statusCode} +${ms}ms`);
      });
      next();
    });
    
    // Enable CORS
    logger.log('🔧 Enabling CORS...');
    app.enableCors();
    
    // Global Validation Pipe
    logger.log('🔧 Setting up global validation pipe...');
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
    }));

    // Swagger Configuration
    logger.log('📚 Setting up Swagger documentation...');
    const swaggerStartTime = Date.now();
    const config = new DocumentBuilder()
      .setTitle('Gemini Cleaning API')
      .setDescription('The Gemini Cleaning Service API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true, // <-- This line persists the JWT token
      },
    });
    logger.log(`✅ Swagger setup completed in ${Date.now() - swaggerStartTime}ms`);

    const PORT = process.env.PORT ?? 3000;
    
    logger.log(`🌐 Starting server on port ${PORT}...`);
    
    const listenStartTime = Date.now();
    await app.listen(PORT);
    const totalBootstrapTime = Date.now() - startTime;
    
    logger.log(`✅ Server started successfully in ${Date.now() - listenStartTime}ms`);
    logger.log(`🎉 Application fully bootstrapped in ${totalBootstrapTime}ms`);
    logger.log(`🚀 Gemini Cleaning API is now running on port ${PORT}`);
    logger.log(`📖 API Documentation available at: http://localhost:${PORT}/api`);
    logger.log(`❤️  Health check available at: http://localhost:${PORT}/health`);
    
    // Log environment info for debugging
    logger.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.log(`🗄️  Database: ${process.env.MONGODB_URI ? 'Configured' : 'NOT CONFIGURED'}`);
    logger.log(`📧 Mail: ${process.env.MAIL_HOST ? 'Configured' : 'NOT CONFIGURED'}`);
    logger.log(`💳 Stripe: ${process.env.STRIPE_SECRET_KEY ? 'Configured' : 'NOT CONFIGURED'}`);
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    logger.error(`❌ Bootstrap failed after ${totalTime}ms`);
    logger.error('Error details:', error);
    throw error;
  }
}

bootstrap().catch((error) => {
  console.error('💥 Fatal error during bootstrap:', error);
  process.exit(1);
});
