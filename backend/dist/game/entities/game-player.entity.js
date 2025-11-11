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
exports.GamePlayer = exports.PlayerRole = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../user/entities/user.entity");
const game_entity_1 = require("./game.entity");
var PlayerRole;
(function (PlayerRole) {
    PlayerRole["MAFIA"] = "mafia";
    PlayerRole["CITIZEN"] = "citizen";
    PlayerRole["DETECTIVE"] = "detective";
    PlayerRole["DOCTOR"] = "doctor";
    PlayerRole["SNIPER"] = "sniper";
})(PlayerRole || (exports.PlayerRole = PlayerRole = {}));
let GamePlayer = class GamePlayer {
};
exports.GamePlayer = GamePlayer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], GamePlayer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], GamePlayer.prototype, "game_id", void 0);
__decorate([
    (0, typeorm_1.Column)('uuid'),
    __metadata("design:type", String)
], GamePlayer.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => game_entity_1.Game, (game) => game.players),
    (0, typeorm_1.JoinColumn)({ name: 'game_id' }),
    __metadata("design:type", game_entity_1.Game)
], GamePlayer.prototype, "game", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.game_players),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], GamePlayer.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PlayerRole,
        nullable: true,
    }),
    __metadata("design:type", String)
], GamePlayer.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], GamePlayer.prototype, "is_alive", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], GamePlayer.prototype, "votes_received", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], GamePlayer.prototype, "is_ready", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], GamePlayer.prototype, "has_voted", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], GamePlayer.prototype, "joined_at", void 0);
exports.GamePlayer = GamePlayer = __decorate([
    (0, typeorm_1.Entity)('game_players')
], GamePlayer);
//# sourceMappingURL=game-player.entity.js.map