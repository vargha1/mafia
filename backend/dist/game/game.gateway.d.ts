import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './services/game.service';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { AuthenticateDto, JoinRoomDto, StartGameDto, SendMessageDto, EliminatePlayerDto, NextPhaseDto } from './dto/websocket.dto';
interface AuthenticatedSocket extends Socket {
    userId?: string;
    gameId?: string;
}
export declare class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private gameService;
    private jwtService;
    private userRepository;
    server: Server;
    private readonly logger;
    private connectedUsers;
    private userSockets;
    private connectionAttempts;
    constructor(gameService: GameService, jwtService: JwtService, userRepository: Repository<User>);
    handleConnection(client: AuthenticatedSocket): void;
    handleDisconnect(client: AuthenticatedSocket): Promise<void>;
    private validateAuthentication;
    private validateGameMembership;
    private sanitizeMessage;
    handleAuthenticate(client: AuthenticatedSocket, data: AuthenticateDto): Promise<{
        success: boolean;
        user: {
            id: string;
            username: string;
            level: number;
            xp: number;
        };
    }>;
    handleJoinRoom(client: AuthenticatedSocket, data: JoinRoomDto): Promise<{
        success: boolean;
        game: import("./entities/game.entity").Game;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        game?: undefined;
    }>;
    handleLeaveRoom(client: AuthenticatedSocket, data: {
        gameId: string;
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleToggleReady(client: AuthenticatedSocket, data: {
        gameId: string;
    }): Promise<{
        success: boolean;
        isReady: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        isReady?: undefined;
    }>;
    handleStartGame(client: AuthenticatedSocket, data: StartGameDto): Promise<{
        success: boolean;
        game: import("./entities/game.entity").Game;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        game?: undefined;
    }>;
    handleMessage(client: AuthenticatedSocket, data: SendMessageDto): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleVote(client: AuthenticatedSocket, data: {
        gameId: string;
        targetPlayerId: string;
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleEliminate(client: AuthenticatedSocket, data: EliminatePlayerDto): Promise<{
        success: boolean;
        result: {
            winner: string;
            game: import("./entities/game.entity").Game;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        result?: undefined;
    }>;
    handleNextPhase(client: AuthenticatedSocket, data: NextPhaseDto): Promise<{
        success: boolean;
        game: import("./entities/game.entity").Game;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        game?: undefined;
    }>;
    handleWebRTCOffer(client: AuthenticatedSocket, data: {
        gameId: string;
        offer: any;
        targetUserId: string;
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleWebRTCAnswer(client: AuthenticatedSocket, data: {
        gameId: string;
        answer: any;
        targetUserId: string;
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleWebRTCIceCandidate(client: AuthenticatedSocket, data: {
        gameId: string;
        candidate: any;
        targetUserId: string;
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
}
export {};
