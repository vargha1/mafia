import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  ValidationPipe,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './services/game.service';
import { UseGuards, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import {
  AuthenticateDto,
  JoinRoomDto,
  LeaveRoomDto,
  ToggleReadyDto,
  StartGameDto,
  SendMessageDto,
  VoteDto,
  EliminatePlayerDto,
  NextPhaseDto,
  WebRTCOfferDto,
  WebRTCAnswerDto,
  WebRTCIceCandidateDto,
} from './dto/websocket.dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  gameId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/game',
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);
  private connectedUsers: Map<string, string> = new Map(); // socketId -> userId
  private userSockets: Map<string, string> = new Map(); // userId -> socketId
  private connectionAttempts: Map<string, number> = new Map(); // IP -> attempt count

  constructor(
    private gameService: GameService,
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  handleConnection(client: AuthenticatedSocket) {
    const clientIP = client.handshake.address || 'unknown';

    // Rate limiting - max 10 connections per minute per IP
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
      } else {
        this.connectionAttempts.set(clientIP, current - 1);
      }
    }, 60000); // 1 minute decay

    this.logger.log(`Client connected: ${client.id} from IP: ${clientIP}`);
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const userId = this.connectedUsers.get(client.id);
    if (userId && client.gameId) {
      try {
        await this.gameService.leaveGame(client.gameId, userId);
        this.server.to(client.gameId).emit('playerLeft', { userId });
      } catch (error) {
        this.logger.error('Error handling disconnect:', error);
      }
    }

    this.connectedUsers.delete(client.id);
    this.userSockets.delete(userId);
  }

  // Helper method to validate authentication for WebSocket events
  private validateAuthentication(client: AuthenticatedSocket): string {
    if (!client.userId) {
      throw new UnauthorizedException('Authentication required');
    }
    return client.userId;
  }

  // Helper method to validate user is in game room
  private validateGameMembership(client: AuthenticatedSocket, gameId: string): void {
    if (!client.userId) {
      throw new UnauthorizedException('Authentication required');
    }

    if (client.gameId !== gameId) {
      throw new UnauthorizedException('User is not in the specified game room');
    }
  }

  // Helper method to sanitize chat messages
  private sanitizeMessage(message: string): string {
    if (!message || typeof message !== 'string') {
      throw new BadRequestException('Invalid message');
    }

    if (message.length > 500) {
      throw new BadRequestException('Message too long (max 500 characters)');
    }

    // Basic XSS prevention - remove HTML tags and normalize whitespace
    return message
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/onload=/gi, '')
      .replace(/onerror=/gi, '')
      .trim()
      .substring(0, 500);
  }

  @SubscribeMessage('authenticate')
  async handleAuthenticate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: AuthenticateDto,
  ) {
    try {
      // Verify JWT token (input already validated by DTO)
      const payload = this.jwtService.verify(data.token);

      // Validate token structure
      if (!payload.sub || !payload.username) {
        throw new UnauthorizedException('Invalid token structure');
      }

      // Verify user exists in database
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (user.isActive === false) {
        throw new UnauthorizedException('Account is deactivated');
      }

      // Check if user is already connected elsewhere
      const existingSocketId = this.userSockets.get(user.id);
      if (existingSocketId && existingSocketId !== client.id) {
        this.logger.warn(`User ${user.id} attempted multiple connections`);
        throw new UnauthorizedException('User already connected');
      }

      // Authenticate the socket
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
    } catch (error) {
      this.logger.warn(`Authentication failed: ${error.message}`);
      client.disconnect(true);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: JoinRoomDto,
  ) {
    try {
      // Validate authentication
      const userId = this.validateAuthentication(client);

      // Join game room (input already validated by DTO)
      client.gameId = data.gameId;
      await client.join(data.gameId);

      const game = await this.gameService.getGame(data.gameId);

      this.server.to(data.gameId).emit('playerJoined', {
        game,
        userId,
      });

      return { success: true, game };
    } catch (error) {
      this.logger.warn(`joinRoom error for ${client.id}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { gameId: string },
  ) {
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
    } catch (error) {
      this.logger.warn(`leaveRoom error for ${client.id}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('toggleReady')
  async handleToggleReady(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { gameId: string },
  ) {
    try {
      const userId = this.validateAuthentication(client);
      this.validateGameMembership(client, data.gameId);

      const isReady = await this.gameService.toggleReady(data.gameId, userId);

      this.server.to(data.gameId).emit('playerReadyChanged', {
        userId,
        isReady,
      });

      return { success: true, isReady };
    } catch (error) {
      this.logger.warn(`toggleReady error for ${client.id}: ${error.message}`);
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
    try {
      const userId = this.validateAuthentication(client);
      this.validateGameMembership(client, data.gameId);

      // Validate and sanitize message
      if (!data.message || typeof data.message !== 'string') {
        throw new BadRequestException('Message is required');
      }

      if (!data.username || typeof data.username !== 'string') {
        throw new BadRequestException('Username is required');
      }

      const sanitizedMessage = this.sanitizeMessage(data.message);
      const sanitizedUsername = this.sanitizeMessage(data.username).substring(0, 50);

      this.server.to(data.gameId).emit('newMessage', {
        userId,
        username: sanitizedUsername,
        message: sanitizedMessage,
        timestamp: new Date(),
      });

      return { success: true };
    } catch (error) {
      this.logger.warn(`sendMessage error for ${client.id}: ${error.message}`);
      return { success: false, error: error.message };
    }
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
  async handleWebRTCOffer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { gameId: string; offer: any; targetUserId: string },
  ) {
    try {
      const userId = this.validateAuthentication(client);
      this.validateGameMembership(client, data.gameId);

      // Validate input
      if (!data.targetUserId || typeof data.targetUserId !== 'string') {
        throw new BadRequestException('Valid targetUserId is required');
      }

      if (!data.offer) {
        throw new BadRequestException('Offer is required');
      }

      // Check if target user is in the same game room
      const targetSocketId = this.userSockets.get(data.targetUserId);
      if (!targetSocketId) {
        throw new BadRequestException('Target user not connected');
      }

      // Verify target user is also in the same game
      const targetSocket = this.server.sockets.sockets.get(targetSocketId) as AuthenticatedSocket;
      if (!targetSocket || targetSocket.gameId !== data.gameId) {
        throw new UnauthorizedException('Target user not in same game room');
      }

      // Rate limiting for WebRTC events
      const webrtcRateLimitKey = `webrtc:${userId}`;
      const lastWebrtcEvent = (client as any).lastWebrtcEvent || 0;
      if (Date.now() - lastWebrtcEvent < 100) { // 100ms minimum between WebRTC events
        throw new BadRequestException('WebRTC rate limit exceeded');
      }
      (client as any).lastWebrtcEvent = Date.now();

      this.server.to(targetSocketId).emit('webrtc-offer', {
        offer: data.offer,
        fromUserId: userId,
      });

      return { success: true };
    } catch (error) {
      this.logger.warn(`webrtc-offer error for ${client.id}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('webrtc-answer')
  async handleWebRTCAnswer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { gameId: string; answer: any; targetUserId: string },
  ) {
    try {
      const userId = this.validateAuthentication(client);
      this.validateGameMembership(client, data.gameId);

      // Validate input
      if (!data.targetUserId || typeof data.targetUserId !== 'string') {
        throw new BadRequestException('Valid targetUserId is required');
      }

      if (!data.answer) {
        throw new BadRequestException('Answer is required');
      }

      // Check if target user is in the same game room
      const targetSocketId = this.userSockets.get(data.targetUserId);
      if (!targetSocketId) {
        throw new BadRequestException('Target user not connected');
      }

      // Verify target user is also in the same game
      const targetSocket = this.server.sockets.sockets.get(targetSocketId) as AuthenticatedSocket;
      if (!targetSocket || targetSocket.gameId !== data.gameId) {
        throw new UnauthorizedException('Target user not in same game room');
      }

      // Rate limiting for WebRTC events
      const lastWebrtcEvent = (client as any).lastWebrtcEvent || 0;
      if (Date.now() - lastWebrtcEvent < 100) {
        throw new BadRequestException('WebRTC rate limit exceeded');
      }
      (client as any).lastWebrtcEvent = Date.now();

      this.server.to(targetSocketId).emit('webrtc-answer', {
        answer: data.answer,
        fromUserId: userId,
      });

      return { success: true };
    } catch (error) {
      this.logger.warn(`webrtc-answer error for ${client.id}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('webrtc-ice-candidate')
  async handleWebRTCIceCandidate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { gameId: string; candidate: any; targetUserId: string },
  ) {
    try {
      const userId = this.validateAuthentication(client);
      this.validateGameMembership(client, data.gameId);

      // Validate input
      if (!data.targetUserId || typeof data.targetUserId !== 'string') {
        throw new BadRequestException('Valid targetUserId is required');
      }

      if (!data.candidate) {
        throw new BadRequestException('Candidate is required');
      }

      // Check if target user is in the same game room
      const targetSocketId = this.userSockets.get(data.targetUserId);
      if (!targetSocketId) {
        throw new BadRequestException('Target user not connected');
      }

      // Verify target user is also in the same game
      const targetSocket = this.server.sockets.sockets.get(targetSocketId) as AuthenticatedSocket;
      if (!targetSocket || targetSocket.gameId !== data.gameId) {
        throw new UnauthorizedException('Target user not in same game room');
      }

      // Rate limiting for WebRTC events (allow higher rate for ICE candidates)
      const lastWebrtcEvent = (client as any).lastWebrtcEvent || 0;
      if (Date.now() - lastWebrtcEvent < 50) { // 50ms minimum for ICE candidates
        throw new BadRequestException('WebRTC rate limit exceeded');
      }
      (client as any).lastWebrtcEvent = Date.now();

      this.server.to(targetSocketId).emit('webrtc-ice-candidate', {
        candidate: data.candidate,
        fromUserId: userId,
      });

      return { success: true };
    } catch (error) {
      this.logger.warn(`webrtc-ice-candidate error for ${client.id}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
