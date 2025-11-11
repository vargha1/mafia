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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = exports.GamePhase = exports.GameMode = exports.GameStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../user/entities/user.entity");
const game_player_entity_1 = require("./game-player.entity");
var GameStatus;
(function (GameStatus) {
    GameStatus["WAITING"] = "waiting";
    GameStatus["IN_PROGRESS"] = "in_progress";
    GameStatus["FINISHED"] = "finished";
})(GameStatus || (exports.GameStatus = GameStatus = {}));
var GameMode;
(function (GameMode) {
    GameMode["SIMPLE"] = "simple";
    GameMode["COMPLETE"] = "complete";
    GameMode["CUSTOM"] = "custom";
})(GameMode || (exports.GameMode = GameMode = {}));
var GamePhase;
(function (GamePhase) {
    GamePhase["LOBBY"] = "lobby";
    GamePhase["NIGHT"] = "night";
    GamePhase["DAY"] = "day";
    GamePhase["VOTING"] = "voting";
    GamePhase["RESULT"] = "result";
})(GamePhase || (exports.GamePhase = GamePhase = {}));
let Game = class Game {
};
exports.Game = Game;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Game.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Game.prototype, "room_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Game.prototype, "max_players", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Game.prototype, "current_players", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: GameMode,
        default: GameMode.SIMPLE,
    }),
    __metadata("design:type", String)
], Game.prototype, "game_mode", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: GameStatus,
        default: GameStatus.WAITING,
    }),
    __metadata("design:type", String)
], Game.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: GamePhase,
        default: GamePhase.LOBBY,
    }),
    __metadata("design:type", String)
], Game.prototype, "phase", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Game.prototype, "custom_roles", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 1 }),
    __metadata("design:type", Number)
], Game.prototype, "day_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Game.prototype, "winner", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], Game.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], Game.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => game_player_entity_1.GamePlayer, (player) => player.game),
    __metadata("design:type", Array)
], Game.prototype, "players", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Game.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Game.prototype, "updated_at", void 0);
exports.Game = Game = __decorate([
    (0, typeorm_1.Entity)('games')
], Game);
//# sourceMappingURL=game.entity.js.map