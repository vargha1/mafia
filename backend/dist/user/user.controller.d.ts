import { UserService } from './user.service';
export declare class UserController {
    private userService;
    constructor(userService: UserService);
    getMyProfile(req: any): Promise<{
        id: string;
        username: string;
        email: string;
        level: number;
        xp: number;
        total_games: number;
        wins: number;
        losses: number;
        created_at: Date;
        updated_at: Date;
        game_players: import("../game/entities/game-player.entity").GamePlayer[];
        game_history: import("../game/entities/game-history.entity").GameHistory[];
    }>;
    getUserProfile(id: string): Promise<{
        id: string;
        username: string;
        email: string;
        level: number;
        xp: number;
        total_games: number;
        wins: number;
        losses: number;
        created_at: Date;
        updated_at: Date;
        game_players: import("../game/entities/game-player.entity").GamePlayer[];
        game_history: import("../game/entities/game-history.entity").GameHistory[];
    }>;
    getLeaderboard(limit?: string): Promise<{
        win_rate: string;
        id: string;
        username: string;
        email: string;
        password: string;
        level: number;
        xp: number;
        total_games: number;
        wins: number;
        losses: number;
        created_at: Date;
        updated_at: Date;
        game_players: import("../game/entities/game-player.entity").GamePlayer[];
        game_history: import("../game/entities/game-history.entity").GameHistory[];
        rank: number;
    }[]>;
}
