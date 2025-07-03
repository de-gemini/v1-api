import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  


  // Enable raw body for Stripe webhook
  app.use('/payments/webhook', bodyParser.raw({ type: 'application/json' }));

  // Request logging middleware
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
  app.enableCors();
  
  // Global Validation Pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Enable raw body for Stripe webhook
  app.use('/payments/webhook', bodyParser.raw({ type: 'application/json' }));

  // Swagger Configuration
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

  const logger = new Logger('Bootstrap');
  const PORT = process.env.PORT ?? 3000

  await app.listen(PORT);
  logger.log(`Listening on port ${PORT}`)
}
bootstrap();
