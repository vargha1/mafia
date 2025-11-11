import { Repository } from 'typeorm';
import { Game, GameStatus, GamePhase, GameMode } from '../entities/game.entity';
import { GamePlayer, PlayerRole } from '../entities/game-player.entity';
import { GameHistory } from '../entities/game-history.entity';
import { CreateGameDto } from '../dto/create-game.dto';
import { UserService } from '../../user/user.service';
export declare class GameService {
    private gameRepository;
    private gamePlayerRepository;
    private gameHistoryRepository;
    private userService;
    constructor(gameRepository: Repository<Game>, gamePlayerRepository: Repository<GamePlayer>, gameHistoryRepository: Repository<GameHistory>, userService: UserService);
    createGame(createGameDto: CreateGameDto, userId: string): Promise<Game>;
    getAvailableGames(): Promise<{
        players: {
            id: string;
            username: string;
            is_ready: boolean;
        }[];
        id: string;
        room_name: string;
        max_players: number;
        current_players: number;
        game_mode: GameMode;
        status: GameStatus;
        phase: GamePhase;
        custom_roles: any;
        day_number: number;
        winner: string;
        created_by: string;
        creator: import("../../user/entities/user.entity").User;
        created_at: Date;
        updated_at: Date;
    }[]>;
    getGame(gameId: string): Promise<Game>;
    joinGame(gameId: string, userId: string): Promise<Game>;
    leaveGame(gameId: string, userId: string): Promise<void>;
    toggleReady(gameId: string, userId: string): Promise<boolean>;
    startGame(gameId: string): Promise<Game>;
    private assignRoles;
    vote(gameId: string, voterId: string, targetId: string): Promise<GamePlayer>;
    eliminatePlayer(gameId: string, playerId: string): Promise<{
        winner: string;
        game: Game;
    }>;
    checkWinCondition(gameId: string): Promise<{
        winner: string;
        game: Game;
    }>;
    private endGame;
    resetVotes(gameId: string): Promise<void>;
    nextPhase(gameId: string): Promise<Game>;
    getPlayerRole(gameId: string, userId: string): Promise<PlayerRole>;
}
