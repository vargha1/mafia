import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './services/game.service';
interface AuthenticatedSocket extends Socket {
    userId?: string;
    gameId?: string;
}
export declare class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private gameService;
    server: Server;
    private connectedUsers;
    constructor(gameService: GameService);
    handleConnection(client: AuthenticatedSocket): void;
    handleDisconnect(client: AuthenticatedSocket): Promise<void>;
    handleAuthenticate(client: AuthenticatedSocket, data: {
        userId: string;
    }): void;
    handleJoinRoom(client: AuthenticatedSocket, data: {
        gameId: string;
    }): Promise<{
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
    handleStartGame(client: AuthenticatedSocket, data: {
        gameId: string;
    }): Promise<{
        success: boolean;
        game: import("./entities/game.entity").Game;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        game?: undefined;
    }>;
    handleMessage(client: AuthenticatedSocket, data: {
        gameId: string;
        message: string;
        username: string;
    }): Promise<{
        success: boolean;
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
    handleEliminate(client: AuthenticatedSocket, data: {
        gameId: string;
        playerId: string;
    }): Promise<{
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
    handleNextPhase(client: AuthenticatedSocket, data: {
        gameId: string;
    }): Promise<{
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
    }): void;
    handleWebRTCAnswer(client: AuthenticatedSocket, data: {
        gameId: string;
        answer: any;
        targetUserId: string;
    }): void;
    handleWebRTCIceCandidate(client: AuthenticatedSocket, data: {
        gameId: string;
        candidate: any;
        targetUserId: string;
    }): void;
}
export {};
