import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './services/game.service';
import { UseGuards, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  gameId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/game',
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, string> = new Map(); // socketId -> userId

  constructor(private gameService: GameService) {}

  handleConnection(client: AuthenticatedSocket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    console.log(`Client disconnected: ${client.id}`);
    
    const userId = this.connectedUsers.get(client.id);
    if (userId && client.gameId) {
      try {
        await this.gameService.leaveGame(client.gameId, userId);
        this.server.to(client.gameId).emit('playerLeft', { userId });
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    }
    
    this.connectedUsers.delete(client.id);
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { userId: string },
  ) {
    client.userId = data.userId;
    this.connectedUsers.set(client.id, data.userId);
    console.log(`User authenticated: ${data.userId}`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { gameId: string },
  ) {
    try {
      client.gameId = data.gameId;
      await client.join(data.gameId);
      
      const game = await this.gameService.getGame(data.gameId);
      
      this.server.to(data.gameId).emit('playerJoined', {
        game,
        userId: client.userId,
      });

      return { success: true, game };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { gameId: string },
  ) {
    try {
      if (client.userId) {
        await this.gameService.leaveGame(data.gameId, client.userId);
        client.leave(data.gameId);
        
        this.server.to(data.gameId).emit('playerLeft', {
          userId: client.userId,
        });
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('toggleReady')
  async handleToggleReady(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { gameId: string },
  ) {
    try {
      const isReady = await this.gameService.toggleReady(data.gameId, client.userId);
      
      this.server.to(data.gameId).emit('playerReadyChanged', {
        userId: client.userId,
        isReady,
      });

      return { success: true, isReady };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('startGame')
  async handleStartGame(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { gameId: string },
  ) {
    try {
      const game = await this.gameService.startGame(data.gameId);
      
      // Send role to each player privately
      for (const player of game.players) {
        const role = await this.gameService.getPlayerRole(game.id, player.user_id);
        const playerSocket = Array.from(this.connectedUsers.entries())
          .find(([_, userId]) => userId === player.user_id);
        
        if (playerSocket) {
          this.server.to(playerSocket[0]).emit('roleAssigned', { role });
        }
      }

      // Broadcast game started
      this.server.to(data.gameId).emit('gameStarted', { game });

      return { success: true, game };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { gameId: string; message: string; username: string },
  ) {
    this.server.to(data.gameId).emit('newMessage', {
      userId: client.userId,
      username: data.username,
      message: data.message,
      timestamp: new Date(),
    });

    return { success: true };
  }

  @SubscribeMessage('vote')
  async handleVote(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { gameId: string; targetPlayerId: string },
  ) {
    try {
      const target = await this.gameService.vote(
        data.gameId,
        client.userId,
        data.targetPlayerId,
      );

      this.server.to(data.gameId).emit('voteReceived', {
        voterId: client.userId,
        targetId: target.id,
        votes: target.votes_received,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('eliminatePlayer')
  async handleEliminate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { gameId: string; playerId: string },
  ) {
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
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('nextPhase')
  async handleNextPhase(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { gameId: string },
  ) {
    try {
      const game = await this.gameService.nextPhase(data.gameId);

      this.server.to(data.gameId).emit('phaseChanged', {
        phase: game.phase,
        dayNumber: game.day_number,
      });

      return { success: true, game };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // WebRTC Signaling
  @SubscribeMessage('webrtc-offer')
  handleWebRTCOffer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { gameId: string; offer: any; targetUserId: string },
  ) {
    const targetSocket = Array.from(this.connectedUsers.entries())
      .find(([_, userId]) => userId === data.targetUserId);
    
    if (targetSocket) {
      this.server.to(targetSocket[0]).emit('webrtc-offer', {
        offer: data.offer,
        fromUserId: client.userId,
      });
    }
  }

  @SubscribeMessage('webrtc-answer')
  handleWebRTCAnswer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { gameId: string; answer: any; targetUserId: string },
  ) {
    const targetSocket = Array.from(this.connectedUsers.entries())
      .find(([_, userId]) => userId === data.targetUserId);
    
    if (targetSocket) {
      this.server.to(targetSocket[0]).emit('webrtc-answer', {
        answer: data.answer,
        fromUserId: client.userId,
      });
    }
  }

  @SubscribeMessage('webrtc-ice-candidate')
  handleWebRTCIceCandidate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { gameId: string; candidate: any; targetUserId: string },
  ) {
    const targetSocket = Array.from(this.connectedUsers.entries())
      .find(([_, userId]) => userId === data.targetUserId);
    
    if (targetSocket) {
      this.server.to(targetSocket[0]).emit('webrtc-ice-candidate', {
        candidate: data.candidate,
        fromUserId: client.userId,
      });
    }
  }
}
