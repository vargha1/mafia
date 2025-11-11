import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SecurityMiddleware, BotDetectionMiddleware, IPValidationMiddleware } from './middleware/security.middleware';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  // Apply security middleware first
  const securityMiddleware = app.get(SecurityMiddleware);
  const botDetectionMiddleware = app.get(BotDetectionMiddleware);
  const ipValidationMiddleware = app.get(IPValidationMiddleware);

  app.use(securityMiddleware.use.bind(securityMiddleware));
  app.use(botDetectionMiddleware.use.bind(botDetectionMiddleware));
  app.use(ipValidationMiddleware.use.bind(ipValidationMiddleware));

  app.enableCors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 8001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Mafia Game Backend running on port ${port}`);
}

bootstrap();
