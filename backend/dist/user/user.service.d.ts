import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
export declare class UserService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    getProfile(userId: string): Promise<{
        id: string;
        username: string;
        email: string;
        level: number;
        xp: number;
        total_games: number;
        wins: number;
        losses: number;
        failed_login_attempts: number;
        locked_until: Date;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
        game_players: import("../game/entities/game-player.entity").GamePlayer[];
        game_history: import("../game/entities/game-history.entity").GameHistory[];
    }>;
    getLeaderboard(limit?: number): Promise<{
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
        failed_login_attempts: number;
        locked_until: Date;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
        game_players: import("../game/entities/game-player.entity").GamePlayer[];
        game_history: import("../game/entities/game-history.entity").GameHistory[];
        rank: number;
    }[]>;
    updateUserStats(userId: string, won: boolean, xpEarned: number): Promise<User>;
}
