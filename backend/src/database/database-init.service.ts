import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryFailedError } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Game } from '../game/entities/game.entity';
import { GamePlayer } from '../game/entities/game-player.entity';
import { GameHistory } from '../game/entities/game-history.entity';

@Injectable()
export class DatabaseInitService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseInitService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(GamePlayer)
    private readonly gamePlayerRepository: Repository<GamePlayer>,
    @InjectRepository(GameHistory)
    private readonly gameHistoryRepository: Repository<GameHistory>,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing database...');

    try {
      // Wait for database connection to be ready
      await this.waitForDatabaseConnection();

      // Check if tables exist, create if they don't
      const tablesExist = await this.checkTablesExist();

      if (!tablesExist) {
        this.logger.warn('Tables do not exist. Creating database tables manually...');
        await this.createTablesManually();
      } else {
        this.logger.log('Database tables already exist');
      }

      this.logger.log('Database initialization completed successfully');
    } catch (error) {
      this.logger.error('Database initialization failed:', error);
      // Don't throw - allow app to start, services will handle missing tables
    }
  }

  private async waitForDatabaseConnection(): Promise<void> {
    const maxRetries = 10;
    const retryDelay = 2000; // 2 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.dataSource.query('SELECT 1');
        this.logger.log('Database connection established');
        return;
      } catch (error) {
        if (attempt === maxRetries) {
          throw new Error(`Failed to connect to database after ${maxRetries} attempts: ${error.message}`);
        }

        this.logger.warn(`Database connection attempt ${attempt}/${maxRetries} failed. Retrying in ${retryDelay}ms...`);
        await this.sleep(retryDelay);
      }
    }
  }

  private async checkTablesExist(): Promise<boolean> {
    try {
      // Check if users table exists
      const result = await this.dataSource.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'users'
        );
      `);

      return result[0].exists;
    } catch (error) {
      this.logger.error('Error checking table existence:', error);
      return false;
    }
  }

  private async createTablesManually(): Promise<void> {
    try {
      this.logger.log('Creating database tables...');

      // Create tables in the correct order considering foreign key dependencies
      await this.createUsersTable();
      await this.createGamesTable();
      await this.createGamePlayersTable();
      await this.createGameHistoryTable();

      this.logger.log('All database tables created successfully');
    } catch (error) {
      this.logger.error('Error creating tables manually:', error);
      throw error;
    }
  }

  private async createUsersTable(): Promise<void> {
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

  private async createGamesTable(): Promise<void> {
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

  private async createGamePlayersTable(): Promise<void> {
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

  private async createGameHistoryTable(): Promise<void> {
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

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check method
  async isDatabaseHealthy(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      const tablesExist = await this.checkTablesExist();
      return tablesExist;
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return false;
    }
  }

  // Get table row counts for basic validation
  async getTableStats(): Promise<{ [key: string]: number }> {
    try {
      const tables = ['users', 'games', 'game_players', 'game_history'];
      const stats: { [key: string]: number } = {};

      for (const table of tables) {
        const result = await this.dataSource.query(`SELECT COUNT(*) as count FROM ${table}`);
        stats[table] = parseInt(result[0].count);
      }

      return stats;
    } catch (error) {
      this.logger.error('Error getting table stats:', error);
      return {};
    }
  }
}