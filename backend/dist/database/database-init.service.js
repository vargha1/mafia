"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DatabaseInitService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseInitService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../user/entities/user.entity");
const game_entity_1 = require("../game/entities/game.entity");
const game_player_entity_1 = require("../game/entities/game-player.entity");
const game_history_entity_1 = require("../game/entities/game-history.entity");
let DatabaseInitService = DatabaseInitService_1 = class DatabaseInitService {
    constructor(dataSource, userRepository, gameRepository, gamePlayerRepository, gameHistoryRepository) {
        this.dataSource = dataSource;
        this.userRepository = userRepository;
        this.gameRepository = gameRepository;
        this.gamePlayerRepository = gamePlayerRepository;
        this.gameHistoryRepository = gameHistoryRepository;
        this.logger = new common_1.Logger(DatabaseInitService_1.name);
    }
    async onModuleInit() {
        this.logger.log('Initializing database...');
        try {
            await this.waitForDatabaseConnection();
            const tablesExist = await this.checkTablesExist();
            if (!tablesExist) {
                this.logger.warn('Tables do not exist. Creating database tables manually...');
                await this.createTablesManually();
            }
            else {
                this.logger.log('Database tables already exist');
            }
            this.logger.log('Database initialization completed successfully');
        }
        catch (error) {
            this.logger.error('Database initialization failed:', error);
        }
    }
    async waitForDatabaseConnection() {
        const maxRetries = 10;
        const retryDelay = 2000;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await this.dataSource.query('SELECT 1');
                this.logger.log('Database connection established');
                return;
            }
            catch (error) {
                if (attempt === maxRetries) {
                    throw new Error(`Failed to connect to database after ${maxRetries} attempts: ${error.message}`);
                }
                this.logger.warn(`Database connection attempt ${attempt}/${maxRetries} failed. Retrying in ${retryDelay}ms...`);
                await this.sleep(retryDelay);
            }
        }
    }
    async checkTablesExist() {
        try {
            const result = await this.dataSource.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'users'
        );
      `);
            return result[0].exists;
        }
        catch (error) {
            this.logger.error('Error checking table existence:', error);
            return false;
        }
    }
    async createTablesManually() {
        try {
            this.logger.log('Creating database tables...');
            await this.createUsersTable();
            await this.createGamesTable();
            await this.createGamePlayersTable();
            await this.createGameHistoryTable();
            this.logger.log('All database tables created successfully');
        }
        catch (error) {
            this.logger.error('Error creating tables manually:', error);
            throw error;
        }
    }
    async createUsersTable() {
        const createTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        total_games INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `;
        await this.dataSource.query(createTableSQL);
        this.logger.log('Users table created');
    }
    async createGamesTable() {
        const createTableSQL = `
      CREATE TABLE IF NOT EXISTS games (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_name VARCHAR(100) NOT NULL,
        max_players INTEGER DEFAULT 10,
        current_players INTEGER DEFAULT 0,
        game_mode VARCHAR(20) DEFAULT 'simple',
        status VARCHAR(20) DEFAULT 'waiting',
        phase VARCHAR(20) DEFAULT 'lobby',
        custom_roles JSONB,
        day_number INTEGER DEFAULT 1,
        winner VARCHAR(20),
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_games_room_name ON games(room_name);
      CREATE INDEX IF NOT EXISTS idx_games_created_by ON games(created_by);
      CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
    `;
        await this.dataSource.query(createTableSQL);
        this.logger.log('Games table created');
    }
    async createGamePlayersTable() {
        const createTableSQL = `
      CREATE TABLE IF NOT EXISTS game_players (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20),
        is_alive BOOLEAN DEFAULT true,
        votes_received INTEGER DEFAULT 0,
        is_ready BOOLEAN DEFAULT false,
        has_voted BOOLEAN DEFAULT false,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(game_id, user_id)
      );

      CREATE INDEX IF NOT EXISTS idx_game_players_game_id ON game_players(game_id);
      CREATE INDEX IF NOT EXISTS idx_game_players_user_id ON game_players(user_id);
    `;
        await this.dataSource.query(createTableSQL);
        this.logger.log('Game players table created');
    }
    async createGameHistoryTable() {
        const createTableSQL = `
      CREATE TABLE IF NOT EXISTS game_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL,
        won BOOLEAN NOT NULL,
        xp_earned INTEGER NOT NULL,
        duration_minutes INTEGER NOT NULL,
        played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_game_history_user_id ON game_history(user_id);
      CREATE INDEX IF NOT EXISTS idx_game_history_game_id ON game_history(game_id);
      CREATE INDEX IF NOT EXISTS idx_game_history_played_at ON game_history(played_at);
    `;
        await this.dataSource.query(createTableSQL);
        this.logger.log('Game history table created');
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async isDatabaseHealthy() {
        try {
            await this.dataSource.query('SELECT 1');
            const tablesExist = await this.checkTablesExist();
            return tablesExist;
        }
        catch (error) {
            this.logger.error('Database health check failed:', error);
            return false;
        }
    }
    async getTableStats() {
        try {
            const tables = ['users', 'games', 'game_players', 'game_history'];
            const stats = {};
            for (const table of tables) {
                const result = await this.dataSource.query(`SELECT COUNT(*) as count FROM ${table}`);
                stats[table] = parseInt(result[0].count);
            }
            return stats;
        }
        catch (error) {
            this.logger.error('Error getting table stats:', error);
            return {};
        }
    }
};
exports.DatabaseInitService = DatabaseInitService;
exports.DatabaseInitService = DatabaseInitService = DatabaseInitService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(game_entity_1.Game)),
    __param(3, (0, typeorm_1.InjectRepository)(game_player_entity_1.GamePlayer)),
    __param(4, (0, typeorm_1.InjectRepository)(game_history_entity_1.GameHistory)),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DatabaseInitService);
//# sourceMappingURL=database-init.service.js.map