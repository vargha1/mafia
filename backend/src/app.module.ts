import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { throttlerConfig } from './config/throttler.config';
import { DatabaseModule } from './database/database.module';
import { DatabaseInitService } from './database/database-init.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { GameModule } from './game/game.module';
import { SecurityMiddleware, BotDetectionMiddleware, IPValidationMiddleware } from './middleware/security.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot(throttlerConfig),
    // Database module must load first to ensure tables exist before other services
    DatabaseModule,
    AuthModule,
    UserModule,
    GameModule,
  ],
  providers: [
    // Make DatabaseInitService globally available
    DatabaseInitService,
    SecurityMiddleware,
    BotDetectionMiddleware,
    IPValidationMiddleware,
  ],
})
export class AppModule {}
