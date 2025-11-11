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
exports.GameGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const game_service_1 = require("./services/game.service");
let GameGateway = class GameGateway {
    constructor(gameService) {
        this.gameService = gameService;
        this.connectedUsers = new Map();
    }
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
    }
    async handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
        const userId = this.connectedUsers.get(client.id);
        if (userId && client.gameId) {
            try {
                await this.gameService.leaveGame(client.gameId, userId);
                this.server.to(client.gameId).emit('playerLeft', { userId });
            }
            catch (error) {
                console.error('Error handling disconnect:', error);
            }
        }
        this.connectedUsers.delete(client.id);
    }
    handleAuthenticate(client, data) {
        client.userId = data.userId;
        this.connectedUsers.set(client.id, data.userId);
        console.log(`User authenticated: ${data.userId}`);
    }
    async handleJoinRoom(client, data) {
        try {
            client.gameId = data.gameId;
            await client.join(data.gameId);
            const game = await this.gameService.getGame(data.gameId);
            this.server.to(data.gameId).emit('playerJoined', {
                game,
                userId: client.userId,
            });
            return { success: true, game };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async handleLeaveRoom(client, data) {
        try {
            if (client.userId) {
                await this.gameService.leaveGame(data.gameId, client.userId);
                client.leave(data.gameId);
                this.server.to(data.gameId).emit('playerLeft', {
                    userId: client.userId,
                });
            }
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async handleToggleReady(client, data) {
        try {
            const isReady = await this.gameService.toggleReady(data.gameId, client.userId);
            this.server.to(data.gameId).emit('playerReadyChanged', {
                userId: client.userId,
                isReady,
            });
            return { success: true, isReady };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async handleStartGame(client, data) {
        try {
            const game = await this.gameService.startGame(data.gameId);
            for (const player of game.players) {
                const role = await this.gameService.getPlayerRole(game.id, player.user_id);
                const playerSocket = Array.from(this.connectedUsers.entries())
                    .find(([_, userId]) => userId === player.user_id);
                if (playerSocket) {
                    this.server.to(playerSocket[0]).emit('roleAssigned', { role });
                }
            }
            this.server.to(data.gameId).emit('gameStarted', { game });
            return { success: true, game };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async handleMessage(client, data) {
        this.server.to(data.gameId).emit('newMessage', {
            userId: client.userId,
            username: data.username,
            message: data.message,
            timestamp: new Date(),
        });
        return { success: true };
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
            const game = await this.gameService.nextPhase(data.gameId);
            this.server.to(data.gameId).emit('phaseChanged', {
                phase: game.phase,
                dayNumber: game.day_number,
            });
            return { success: true, game };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    handleWebRTCOffer(client, data) {
        const targetSocket = Array.from(this.connectedUsers.entries())
            .find(([_, userId]) => userId === data.targetUserId);
        if (targetSocket) {
            this.server.to(targetSocket[0]).emit('webrtc-offer', {
                offer: data.offer,
                fromUserId: client.userId,
            });
        }
    }
    handleWebRTCAnswer(client, data) {
        const targetSocket = Array.from(this.connectedUsers.entries())
            .find(([_, userId]) => userId === data.targetUserId);
        if (targetSocket) {
            this.server.to(targetSocket[0]).emit('webrtc-answer', {
                answer: data.answer,
                fromUserId: client.userId,
            });
        }
    }
    handleWebRTCIceCandidate(client, data) {
        const targetSocket = Array.from(this.connectedUsers.entries())
            .find(([_, userId]) => userId === data.targetUserId);
        if (targetSocket) {
            this.server.to(targetSocket[0]).emit('webrtc-ice-candidate', {
                candidate: data.candidate,
                fromUserId: client.userId,
            });
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
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handleAuthenticate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
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
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleStartGame", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
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
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleEliminate", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('nextPhase'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleNextPhase", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('webrtc-offer'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handleWebRTCOffer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('webrtc-answer'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handleWebRTCAnswer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('webrtc-ice-candidate'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], GameGateway.prototype, "handleWebRTCIceCandidate", null);
exports.GameGateway = GameGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
            credentials: true,
        },
        namespace: '/game',
    }),
    __metadata("design:paramtypes", [game_service_1.GameService])
], GameGateway);
//# sourceMappingURL=game.gateway.js.map