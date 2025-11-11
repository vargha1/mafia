import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameService } from './services/game.service';
import { GameController } from './game.controller';
import { GameGateway } from './game.gateway';
import { Game } from './entities/game.entity';
import { GamePlayer } from './entities/game-player.entity';
import { GameHistory } from './entities/game-history.entity';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game, GamePlayer, GameHistory, User]),
    UserModule,
    AuthModule,
  ],
  controllers: [GameController],
  providers: [GameService, GameGateway],
  exports: [GameService],
})
export class GameModule {}
