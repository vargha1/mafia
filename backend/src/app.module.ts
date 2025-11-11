import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { throttlerConfig } from './config/throttler.config';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { GameModule } from './game/game.module';
import { SecurityMiddleware, BotDetectionMiddleware, IPValidationMiddleware } from './middleware/security.middleware';
import { User } from './user/entities/user.entity';
import { Game } from './game/entities/game.entity';
import { GamePlayer } from './game/entities/game-player.entity';
import { GameHistory } from './game/entities/game-history.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot(throttlerConfig),
    TypeOrmModule.forRoot(databaseConfig.getTypeOrmConfig()),
    AuthModule,
    UserModule,
    GameModule,
  ],
  providers: [
    SecurityMiddleware,
    BotDetectionMiddleware,
    IPValidationMiddleware,
  ],
})
export class AppModule {}
