import { OnModuleInit } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Game } from '../game/entities/game.entity';
import { GamePlayer } from '../game/entities/game-player.entity';
import { GameHistory } from '../game/entities/game-history.entity';
export declare class DatabaseInitService implements OnModuleInit {
    private readonly dataSource;
    private readonly userRepository;
    private readonly gameRepository;
    private readonly gamePlayerRepository;
    private readonly gameHistoryRepository;
    private readonly logger;
    constructor(dataSource: DataSource, userRepository: Repository<User>, gameRepository: Repository<Game>, gamePlayerRepository: Repository<GamePlayer>, gameHistoryRepository: Repository<GameHistory>);
    onModuleInit(): Promise<void>;
    private waitForDatabaseConnection;
    private checkTablesExist;
    private createTablesManually;
    private createUsersTable;
    private createGamesTable;
    private createGamePlayersTable;
    private createGameHistoryTable;
    private sleep;
    isDatabaseHealthy(): Promise<boolean>;
    getTableStats(): Promise<{
        [key: string]: number;
    }>;
}
