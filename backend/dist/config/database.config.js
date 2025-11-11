"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfig = void 0;
const user_entity_1 = require("../user/entities/user.entity");
const game_entity_1 = require("../game/entities/game.entity");
const game_player_entity_1 = require("../game/entities/game-player.entity");
const game_history_entity_1 = require("../game/entities/game-history.entity");
exports.databaseConfig = {
    validateConfig() {
        const requiredEnvVars = ['DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        if (missingVars.length > 0) {
            throw new Error(`Missing required database environment variables: ${missingVars.join(', ')}`);
        }
        const dbPort = parseInt(process.env.DB_PORT || '5432');
        if (isNaN(dbPort) || dbPort < 1 || dbPort > 65535) {
            throw new Error('Invalid DB_PORT: must be a number between 1 and 65535');
        }
        const maxConnections = parseInt(process.env.DB_MAX_CONNECTIONS || '20');
        if (isNaN(maxConnections) || maxConnections < 1 || maxConnections > 100) {
            throw new Error('Invalid DB_MAX_CONNECTIONS: must be between 1 and 100');
        }
        const connectionTimeout = parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000');
        if (isNaN(connectionTimeout) || connectionTimeout < 1000 || connectionTimeout > 300000) {
            throw new Error('Invalid DB_CONNECTION_TIMEOUT: must be between 1000 and 300000 ms');
        }
    },
    getTypeOrmConfig() {
        this.validateConfig();
        const isProduction = process.env.NODE_ENV === 'production';
        return {
            type: 'postgres',
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT) || 5432,
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            ssl: isProduction ? { rejectUnauthorized: false } : false,
            logging: process.env.NODE_ENV === 'development',
            synchronize: process.env.NODE_ENV === 'development',
            entities: [user_entity_1.User, game_entity_1.Game, game_player_entity_1.GamePlayer, game_history_entity_1.GameHistory],
            pool: {
                min: parseInt(process.env.DB_MIN_CONNECTIONS || '5'),
                max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
                acquireTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
                createTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
                destroyTimeoutMillis: parseInt(process.env.DB_DESTROY_TIMEOUT || '5000'),
                idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
                reapIntervalMillis: 1000,
                createRetryIntervalMillis: 200
            }
        };
    }
};
//# sourceMappingURL=database.config.js.map