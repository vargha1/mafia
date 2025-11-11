import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { throttlerConfig } from './config/throttler.config';
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
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE || 'mafia_game',
      entities: [User, Game, GamePlayer, GameHistory],
      synchronize: process.env.NODE_ENV === 'development', // Only sync in development
      logging: process.env.NODE_ENV === 'development',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      pool: {
        min: 5,
        max: 20,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200,
      },
    }),
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
