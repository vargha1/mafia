import { GameService } from './services/game.service';
import { CreateGameDto } from './dto/create-game.dto';
export declare class GameController {
    private gameService;
    constructor(gameService: GameService);
    createGame(createGameDto: CreateGameDto, req: any): Promise<import("./entities/game.entity").Game>;
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
        game_mode: import("./entities/game.entity").GameMode;
        status: import("./entities/game.entity").GameStatus;
        phase: import("./entities/game.entity").GamePhase;
        custom_roles: any;
        day_number: number;
        winner: string;
        created_by: string;
        creator: import("../user/entities/user.entity").User;
        created_at: Date;
        updated_at: Date;
    }[]>;
    getGame(id: string): Promise<import("./entities/game.entity").Game>;
    joinGame(id: string, req: any): Promise<import("./entities/game.entity").Game>;
    leaveGame(id: string, req: any): Promise<void>;
}
