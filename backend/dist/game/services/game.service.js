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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const game_entity_1 = require("../entities/game.entity");
const game_player_entity_1 = require("../entities/game-player.entity");
const game_history_entity_1 = require("../entities/game-history.entity");
const user_service_1 = require("../../user/user.service");
let GameService = class GameService {
    constructor(gameRepository, gamePlayerRepository, gameHistoryRepository, userService) {
        this.gameRepository = gameRepository;
        this.gamePlayerRepository = gamePlayerRepository;
        this.gameHistoryRepository = gameHistoryRepository;
        this.userService = userService;
    }
    async createGame(createGameDto, userId) {
        const game = this.gameRepository.create({
            room_name: createGameDto.room_name,
            max_players: createGameDto.max_players,
            game_mode: createGameDto.game_mode,
            custom_roles: createGameDto.custom_roles || null,
            created_by: userId,
            current_players: 0,
        });
        await this.gameRepository.save(game);
        return game;
    }
    async getAvailableGames() {
        const games = await this.gameRepository.find({
            where: { status: game_entity_1.GameStatus.WAITING },
            relations: ['creator', 'players', 'players.user'],
            order: { created_at: 'DESC' },
        });
        return games.map(game => ({
            ...game,
            players: game.players.map(p => ({
                id: p.id,
                username: p.user.username,
                is_ready: p.is_ready,
            })),
        }));
    }
    async getGame(gameId) {
        const game = await this.gameRepository.findOne({
            where: { id: gameId },
            relations: ['players', 'players.user'],
        });
        if (!game) {
            throw new common_1.NotFoundException('Game not found');
        }
        return game;
    }
    async joinGame(gameId, userId) {
        const game = await this.getGame(gameId);
        if (game.status !== game_entity_1.GameStatus.WAITING) {
            throw new common_1.BadRequestException('Game has already started');
        }
        if (game.current_players >= game.max_players) {
            throw new common_1.BadRequestException('Game is full');
        }
        const existingPlayer = await this.gamePlayerRepository.findOne({
            where: { game_id: gameId, user_id: userId },
        });
        if (existingPlayer) {
            throw new common_1.BadRequestException('Already joined this game');
        }
        const gamePlayer = this.gamePlayerRepository.create({
            game_id: gameId,
            user_id: userId,
        });
        await this.gamePlayerRepository.save(gamePlayer);
        game.current_players += 1;
        await this.gameRepository.save(game);
        return this.getGame(gameId);
    }
    async leaveGame(gameId, userId) {
        const player = await this.gamePlayerRepository.findOne({
            where: { game_id: gameId, user_id: userId },
        });
        if (!player) {
            throw new common_1.NotFoundException('Player not in this game');
        }
        await this.gamePlayerRepository.remove(player);
        const game = await this.getGame(gameId);
        game.current_players -= 1;
        if (game.current_players === 0) {
            await this.gameRepository.remove(game);
        }
        else {
            await this.gameRepository.save(game);
        }
    }
    async toggleReady(gameId, userId) {
        const player = await this.gamePlayerRepository.findOne({
            where: { game_id: gameId, user_id: userId },
        });
        if (!player) {
            throw new common_1.NotFoundException('Player not in this game');
        }
        player.is_ready = !player.is_ready;
        await this.gamePlayerRepository.save(player);
        return player.is_ready;
    }
    async startGame(gameId) {
        const game = await this.getGame(gameId);
        if (game.status !== game_entity_1.GameStatus.WAITING) {
            throw new common_1.BadRequestException('Game already started');
        }
        if (game.current_players < 4) {
            throw new common_1.BadRequestException('Need at least 4 players to start');
        }
        const allReady = game.players.every(p => p.is_ready);
        if (!allReady) {
            throw new common_1.BadRequestException('All players must be ready');
        }
        await this.assignRoles(game);
        game.status = game_entity_1.GameStatus.IN_PROGRESS;
        game.phase = game_entity_1.GamePhase.NIGHT;
        game.day_number = 1;
        await this.gameRepository.save(game);
        return this.getGame(gameId);
    }
    async assignRoles(game) {
        const players = game.players;
        const totalPlayers = players.length;
        let roleConfig;
        if (game.game_mode === game_entity_1.GameMode.SIMPLE) {
            const mafiaCount = Math.floor(totalPlayers / 4);
            roleConfig = {
                mafia: mafiaCount,
                detective: 1,
                citizen: totalPlayers - mafiaCount - 1,
            };
        }
        else if (game.game_mode === game_entity_1.GameMode.COMPLETE) {
            const mafiaCount = Math.floor(totalPlayers / 3);
            roleConfig = {
                mafia: mafiaCount,
                detective: 1,
                doctor: 1,
                sniper: totalPlayers > 8 ? 1 : 0,
                citizen: totalPlayers - mafiaCount - 2 - (totalPlayers > 8 ? 1 : 0),
            };
        }
        else {
            roleConfig = game.custom_roles;
        }
        const roles = [];
        for (let i = 0; i < (roleConfig.mafia || 0); i++) {
            roles.push(game_player_entity_1.PlayerRole.MAFIA);
        }
        for (let i = 0; i < (roleConfig.detective || 0); i++) {
            roles.push(game_player_entity_1.PlayerRole.DETECTIVE);
        }
        for (let i = 0; i < (roleConfig.doctor || 0); i++) {
            roles.push(game_player_entity_1.PlayerRole.DOCTOR);
        }
        for (let i = 0; i < (roleConfig.sniper || 0); i++) {
            roles.push(game_player_entity_1.PlayerRole.SNIPER);
        }
        for (let i = 0; i < (roleConfig.citizen || 0); i++) {
            roles.push(game_player_entity_1.PlayerRole.CITIZEN);
        }
        for (let i = roles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [roles[i], roles[j]] = [roles[j], roles[i]];
        }
        for (let i = 0; i < players.length; i++) {
            players[i].role = roles[i];
            await this.gamePlayerRepository.save(players[i]);
        }
    }
    async vote(gameId, voterId, targetId) {
        const queryRunner = this.gamePlayerRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const game = await queryRunner.manager.findOne(game_entity_1.Game, {
                where: { id: gameId },
                relations: ['players'],
                lock: { mode: 'pessimistic_write' },
            });
            if (!game) {
                await queryRunner.rollbackTransaction();
                throw new common_1.NotFoundException('Game not found');
            }
            if (game.phase !== game_entity_1.GamePhase.VOTING) {
                await queryRunner.rollbackTransaction();
                throw new common_1.BadRequestException('Not in voting phase');
            }
            const target = await queryRunner.manager.findOne(game_player_entity_1.GamePlayer, {
                where: { id: targetId, game_id: gameId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!target) {
                await queryRunner.rollbackTransaction();
                throw new common_1.NotFoundException('Target player not found');
            }
            const voter = game.players.find(p => p.user_id === voterId);
            if (!voter) {
                await queryRunner.rollbackTransaction();
                throw new common_1.NotFoundException('Voter not found in game');
            }
            if (!voter.is_alive) {
                await queryRunner.rollbackTransaction();
                throw new common_1.BadRequestException('Dead players cannot vote');
            }
            if (!target.is_alive) {
                await queryRunner.rollbackTransaction();
                throw new common_1.BadRequestException('Cannot vote for dead player');
            }
            if (voter.has_voted) {
                await queryRunner.rollbackTransaction();
                throw new common_1.BadRequestException('Player has already voted');
            }
            target.votes_received = (target.votes_received || 0) + 1;
            const updatedTarget = await queryRunner.manager.save(target);
            voter.has_voted = true;
            await queryRunner.manager.save(voter);
            await queryRunner.commitTransaction();
            return updatedTarget;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async eliminatePlayer(gameId, playerId) {
        const player = await this.gamePlayerRepository.findOne({
            where: { id: playerId },
        });
        if (!player) {
            throw new common_1.NotFoundException('Player not found');
        }
        player.is_alive = false;
        await this.gamePlayerRepository.save(player);
        return this.checkWinCondition(gameId);
    }
    async checkWinCondition(gameId) {
        const game = await this.getGame(gameId);
        const alivePlayers = game.players.filter(p => p.is_alive);
        const aliveMafia = alivePlayers.filter(p => p.role === game_player_entity_1.PlayerRole.MAFIA).length;
        const aliveCitizens = alivePlayers.filter(p => p.role !== game_player_entity_1.PlayerRole.MAFIA).length;
        if (aliveMafia === 0) {
            game.winner = 'citizen';
            game.status = game_entity_1.GameStatus.FINISHED;
            game.phase = game_entity_1.GamePhase.RESULT;
            await this.gameRepository.save(game);
            await this.endGame(game);
            return { winner: 'citizen', game };
        }
        if (aliveMafia >= aliveCitizens) {
            game.winner = 'mafia';
            game.status = game_entity_1.GameStatus.FINISHED;
            game.phase = game_entity_1.GamePhase.RESULT;
            await this.gameRepository.save(game);
            await this.endGame(game);
            return { winner: 'mafia', game };
        }
        return { winner: null, game };
    }
    async endGame(game) {
        const isMafiaWin = game.winner === 'mafia';
        for (const player of game.players) {
            const won = (player.role === game_player_entity_1.PlayerRole.MAFIA && isMafiaWin) ||
                (player.role !== game_player_entity_1.PlayerRole.MAFIA && !isMafiaWin);
            const xpEarned = won ? 100 : 50;
            const history = this.gameHistoryRepository.create({
                user_id: player.user_id,
                game_id: game.id,
                role: player.role,
                won,
                xp_earned: xpEarned,
                duration_minutes: Math.floor((new Date().getTime() - game.created_at.getTime()) / 60000),
            });
            await this.gameHistoryRepository.save(history);
            await this.userService.updateUserStats(player.user_id, won, xpEarned);
        }
    }
    async resetVotes(gameId) {
        const queryRunner = this.gamePlayerRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const players = await queryRunner.manager.find(game_player_entity_1.GamePlayer, {
                where: { game_id: gameId },
                lock: { mode: 'pessimistic_write' },
            });
            for (const player of players) {
                player.votes_received = 0;
                player.has_voted = false;
                await queryRunner.manager.save(player);
            }
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async nextPhase(gameId) {
        const game = await this.getGame(gameId);
        switch (game.phase) {
            case game_entity_1.GamePhase.NIGHT:
                game.phase = game_entity_1.GamePhase.DAY;
                break;
            case game_entity_1.GamePhase.DAY:
                game.phase = game_entity_1.GamePhase.VOTING;
                break;
            case game_entity_1.GamePhase.VOTING:
                game.phase = game_entity_1.GamePhase.NIGHT;
                game.day_number += 1;
                await this.resetVotes(gameId);
                break;
        }
        await this.gameRepository.save(game);
        return game;
    }
    async getPlayerRole(gameId, userId) {
        const player = await this.gamePlayerRepository.findOne({
            where: { game_id: gameId, user_id: userId },
        });
        return player?.role;
    }
};
exports.GameService = GameService;
exports.GameService = GameService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(game_entity_1.Game)),
    __param(1, (0, typeorm_1.InjectRepository)(game_player_entity_1.GamePlayer)),
    __param(2, (0, typeorm_1.InjectRepository)(game_history_entity_1.GameHistory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        user_service_1.UserService])
], GameService);
//# sourceMappingURL=game.service.js.map