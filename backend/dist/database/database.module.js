"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const database_init_service_1 = require("./database-init.service");
const database_config_1 = require("../config/database.config");
const user_entity_1 = require("../user/entities/user.entity");
const game_entity_1 = require("../game/entities/game.entity");
const game_player_entity_1 = require("../game/entities/game-player.entity");
const game_history_entity_1 = require("../game/entities/game-history.entity");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot(database_config_1.databaseConfig.getTypeOrmConfig()),
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, game_entity_1.Game, game_player_entity_1.GamePlayer, game_history_entity_1.GameHistory]),
        ],
        providers: [database_init_service_1.DatabaseInitService],
        exports: [typeorm_1.TypeOrmModule, database_init_service_1.DatabaseInitService],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map