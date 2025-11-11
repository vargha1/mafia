import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseInitService } from './database-init.service';
import { databaseConfig } from '../config/database.config';
import { User } from '../user/entities/user.entity';
import { Game } from '../game/entities/game.entity';
import { GamePlayer } from '../game/entities/game-player.entity';
import { GameHistory } from '../game/entities/game-history.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig.getTypeOrmConfig()),
    TypeOrmModule.forFeature([User, Game, GamePlayer, GameHistory]),
  ],
  providers: [DatabaseInitService],
  exports: [TypeOrmModule, DatabaseInitService],
})
export class DatabaseModule {}