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
var GameGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const game_service_1 = require("./services/game.service");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../user/entities/user.entity");
const websocket_dto_1 = require("./dto/websocket.dto");
let GameGateway = GameGateway_1 = class GameGateway {
    constructor(gameService, jwtService, userRepository) {
        this.gameService = gameService;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.logger = new common_1.Logger(GameGateway_1.name);
        this.connectedUsers = new Map();
        this.userSockets = new Map();
        this.connectionAttempts = new Map();
    }
    handleConnection(client) {
        const clientIP = client.handshake.address || 'unknown';
        const attempts = this.connectionAttempts.get(clientIP) || 0;
        if (attempts > 10) {
            this.logger.warn(`Connection rate limit exceeded for IP: ${clientIP}`);
            client.disconnect(true);
            return;
        }
        this.connectionAttempts.set(clientIP, attempts + 1);
        setTimeout(() => {
            const current = this.connectionAttempts.get(clientIP) || 0;
            if (current <= 1) {
                this.connectionAttempts.delete(clientIP);
            }
            else {
                this.connectionAttempts.set(clientIP, current - 1);
            }
        }, 60000);
        this.logger.log(`Client connected: ${client.id} from IP: ${clientIP}`);
    }
    async handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
        const userId = this.connectedUsers.get(client.id);
        if (userId && client.gameId) {
            try {
                await this.gameService.leaveGame(client.gameId, userId);
                this.server.to(client.gameId).emit('playerLeft', { userId });
            }
            catch (error) {
                this.logger.error('Error handling disconnect:', error);
            }
        }
        this.connectedUsers.delete(client.id);
        this.userSockets.delete(userId);
    }
    validateAuthentication(client) {
        if (!client.userId) {
            throw new common_1.UnauthorizedException('Authentication required');
        }
        return client.userId;
    }
    validateGameMembership(client, gameId) {
        if (!client.userId) {
            throw new common_1.UnauthorizedException('Authentication required');
        }
        if (client.gameId !== gameId) {
            throw new common_1.UnauthorizedException('User is not in the specified game room');
        }
    }
    sanitizeMessage(message) {
        if (!message || typeof message !== 'string') {
            throw new common_1.BadRequestException('Invalid message');
        }
        if (message.length > 500) {
            throw new common_1.BadRequestException('Message too long (max 500 characters)');
        }
        return message
            .replace(/<[^>]*>/g, '')
            .replace(/javascript:/gi, '')
            .replace(/vbscript:/gi, '')
            .replace(/onload=/gi, '')
            .replace(/onerror=/gi, '')
            .trim()
            .substring(0, 500);
    }
    async handleAuthenticate(client, data) {
        try {
            const payload = this.jwtService.verify(data.token);
            if (!payload.sub || !payload.username) {
                throw new common_1.UnauthorizedException('Invalid token structure');
            }
            const user = await this.userRepository.findOne({
                where: { id: payload.sub },
            });
            if (!user) {
                throw new common_1.UnauthorizedException('User not found');
            }
            if (user.isActive === false) {
                throw new common_1.UnauthorizedException('Account is deactivated');
            }
            const existingSocketId = this.userSockets.get(user.id);
            if (existingSocketId && existingSocketId !== client.id) {
                this.logger.warn(`User ${user.id} attempted multiple connections`);
                throw new common_1.UnauthorizedException('User already connected');
            }
            client.userId = user.id;
            this.connectedUsers.set(client.id, user.id);
            this.userSockets.set(user.id, client.id);
            this.logger.log(`User authenticated successfully: ${user.username} (${user.id})`);
            return {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    level: user.level,
                    xp: user.xp
                }
            };
        }
        catch (error) {
            this.logger.warn(`Authentication failed: ${error.message}`);
            client.disconnect(true);
            throw new common_1.UnauthorizedException('Authentication failed');
        }
    }
    async handleJoinRoom(client, data) {
        try {
            const userId = this.validateAuthentication(client);
            client.gameId = data.gameId;
            await client.join(data.gameId);
            const game = await this.gameService.getGame(data.gameId);
            this.server.to(data.gameId).emit('playerJoined', {
                game,
                userId,
            });
            return { success: true, game };
        }
        catch (error) {
            this.logger.warn(`joinRoom error for ${client.id}: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async handleLeaveRoom(client, data) {
        try {
            const userId = this.validateAuthentication(client);
            this.validateGameMembership(client, data.gameId);
            await this.gameService.leaveGame(data.gameId, userId);
            client.leave(data.gameId);
            client.gameId = undefined;
            this.server.to(data.gameId).emit('playerLeft', {
                userId,
            });
            return { success: true };
        }
        catch (error) {
            this.logger.warn(`leaveRoom error for ${client.id}: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async handleToggleReady(client, data) {
        try {
            const userId = this.validateAuthentication(client);
            this.validateGameMembership(client, data.gameId);
            const isReady = await this.gameService.toggleReady(data.gameId, userId);
            this.server.to(data.gameId).emit('playerReadyChanged', {
                userId,
                isReady,
            });
            return { success: true, isReady };
        }
        catch (error) {
            this.logger.warn(`toggleReady error for ${client.id}: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async handleStartGame(client, data) {
        try {
            const userId = this.validateAuthentication(client);
            const game = await this.gameService.getGame(data.gameId);
            if (game.created_by !== userId) {
                throw new common_1.UnauthorizedException('Only the game creator can start the game');
            }
            const startedGame = await this.gameService.startGame(data.gameId);
            for (const player of startedGame.players) {
                const role = await this.gameService.getPlayerRole(startedGame.id, player.user_id);
                const playerSocket = Array.from(this.connectedUsers.entries())
                    .find(([_, userId]) => userId === player.user_id);
                if (playerSocket) {
                    this.server.to(playerSocket[0]).emit('roleAssigned', { role });
                }
            }
            this.server.to(data.gameId).emit('gameStarted', { game: startedGame });
            return { success: true, game: startedGame };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async handleMessage(client, data) {
        try {
            const userId = this.validateAuthentication(client);
            this.validateGameMembership(client, data.gameId);
            const sanitizedMessage = this.sanitizeMessage(data.message);
            const sanitizedUsername = this.sanitizeMessage(data.username);
            this.server.to(data.gameId).emit('newMessage', {
                userId,
                username: sanitizedUsername,
                message: sanitizedMessage,
                timestamp: new Date(),
            });
            return { success: true };
        }
        catch (error) {
            this.logger.warn(`sendMessage error for ${client.id}: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async handleVote(client, data) {
        try {
            const target = await this.gameService.vote(data.gameId, client.userId, data.targetPlayerId);
            this.server.to(data.gameId).emit('voteReceived', {
                voterId: client.userId,
                targetId: target.id,
                votes: target.votes_received,
            });
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async handleEliminate(client, data) {
        try {
            const userId = this.validateAuthentication(client);
            const game = await this.gameService.getGame(data.gameId);
            if (game.created_by !== userId) {
                throw new common_1.UnauthorizedException('Only the game creator can eliminate players');
            }
            const result = await this.gameService.eliminatePlayer(data.gameId, data.playerId);
            this.server.to(data.gameId).emit('playerEliminated', {
                playerId: data.playerId,
            });
            if (result.winner) {
                this.server.to(data.gameId).emit('gameEnded', {
                    winner: result.winner,
                    game: result.game,
                });
            }
            return { success: true, result };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async handleNextPhase(client, data) {
        try {
            const userId = this.validateAuthentication(client);
            const game = await this.gameService.getGame(data.gameId);
            if (game.created_by !== userId) {
                throw new common_1.UnauthorizedException('Only the game creator can advance game phases');
            }
            const updatedGame = await this.gameService.nextPhase(data.gameId);
            this.server.to(data.gameId).emit('phaseChanged', {
                phase: updatedGame.phase,
                dayNumber: updatedGame.day_number,
            });
            return { success: true, game: updatedGame };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async handleWebRTCOffer(client, data) {
        try {
            const userId = this.validateAuthentication(client);
            this.validateGameMembership(client, data.gameId);
            if (!data.targetUserId || typeof data.targetUserId !== 'string') {
                throw new common_1.BadRequestException('Valid targetUserId is required');
            }
            if (!data.offer) {
                throw new common_1.BadRequestException('Offer is required');
            }
            const targetSocketId = this.userSockets.get(data.targetUserId);
            if (!targetSocketId) {
                throw new common_1.BadRequestException('Target user not connected');
            }
            const targetSocket = this.server.sockets.sockets.get(targetSocketId);
            if (!targetSocket || targetSocket.gameId !== data.gameId) {
                throw new common_1.UnauthorizedException('Target user not in same game room');
            }
            const webrtcRateLimitKey = `webrtc:${userId}`;
            const lastWebrtcEvent = client.lastWebrtcEvent || 0;
            if (Date.now() - lastWebrtcEvent < 100) {
                throw new common_1.BadRequestException('WebRTC rate limit exceeded');
            }
            client.lastWebrtcEvent = Date.now();
            this.server.to(targetSocketId).emit('webrtc-offer', {
                offer: data.offer,
                fromUserId: userId,
            });
            return { success: true };
        }
        catch (error) {
            this.logger.warn(`webrtc-offer error for ${client.id}: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async handleWebRTCAnswer(client, data) {
        try {
            const userId = this.validateAuthentication(client);
            this.validateGameMembership(client, data.gameId);
            if (!data.targetUserId || typeof data.targetUserId !== 'string') {
                throw new common_1.BadRequestException('Valid targetUserId is required');
            }
            if (!data.answer) {
                throw new common_1.BadRequestException('Answer is required');
            }
            const targetSocketId = this.userSockets.get(data.targetUserId);
            if (!targetSocketId) {
                throw new common_1.BadRequestException('Target user not connected');
            }
            const targetSocket = this.server.sockets.sockets.get(targetSocketId);
            if (!targetSocket || targetSocket.gameId !== data.gameId) {
                throw new common_1.UnauthorizedException('Target user not in same game room');
            }
            const lastWebrtcEvent = client.lastWebrtcEvent || 0;
            if (Date.now() - lastWebrtcEvent < 100) {
                throw new common_1.BadRequestException('WebRTC rate limit exceeded');
            }
            client.lastWebrtcEvent = Date.now();
            this.server.to(targetSocketId).emit('webrtc-answer', {
                answer: data.answer,
                fromUserId: userId,
            });
            return { success: true };
        }
        catch (error) {
            this.logger.warn(`webrtc-answer error for ${client.id}: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    async handleWebRTCIceCandidate(client, data) {
        try {
            const userId = this.validateAuthentication(client);
            this.validateGameMembership(client, data.gameId);
            if (!data.targetUserId || typeof data.targetUserId !== 'string') {
                throw new common_1.BadRequestException('Valid targetUserId is required');
            }
            if (!data.candidate) {
                throw new common_1.BadRequestException('Candidate is required');
            }
            const targetSocketId = this.userSockets.get(data.targetUserId);
            if (!targetSocketId) {
                throw new common_1.BadRequestException('Target user not connected');
            }
            const targetSocket = this.server.sockets.sockets.get(targetSocketId);
            if (!targetSocket || targetSocket.gameId !== data.gameId) {
                throw new common_1.UnauthorizedException('Target user not in same game room');
            }
            const lastWebrtcEvent = client.lastWebrtcEvent || 0;
            if (Date.now() - lastWebrtcEvent < 50) {
                throw new common_1.BadRequestException('WebRTC rate limit exceeded');
            }
            client.lastWebrtcEvent = Date.now();
            this.server.to(targetSocketId).emit('webrtc-ice-candidate', {
                candidate: data.candidate,
                fromUserId: userId,
            });
            return { success: true };
        }
        catch (error) {
            this.logger.warn(`webrtc-ice-candidate error for ${client.id}: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
};
exports.GameGateway = GameGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], GameGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('authenticate'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, websocket_dto_1.AuthenticateDto]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleAuthenticate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, websocket_dto_1.JoinRoomDto]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleLeaveRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('toggleReady'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleToggleReady", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('startGame'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, websocket_dto_1.StartGameDto]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleStartGame", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, websocket_dto_1.SendMessageDto]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('vote'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleVote", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('eliminatePlayer'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, websocket_dto_1.EliminatePlayerDto]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleEliminate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('nextPhase'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, websocket_dto_1.NextPhaseDto]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleNextPhase", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('webrtc-offer'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleWebRTCOffer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('webrtc-answer'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleWebRTCAnswer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('webrtc-ice-candidate'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleWebRTCIceCandidate", null);
exports.GameGateway = GameGateway = GameGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
            credentials: true,
        },
        namespace: '/game',
    }),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [game_service_1.GameService,
        jwt_1.JwtService,
        typeorm_2.Repository])
], GameGateway);
//# sourceMappingURL=game.gateway.js.map