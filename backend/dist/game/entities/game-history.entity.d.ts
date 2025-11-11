import { User } from '../../user/entities/user.entity';
import { PlayerRole } from './game-player.entity';
export declare class GameHistory {
    id: string;
    user_id: string;
    game_id: string;
    user: User;
    role: PlayerRole;
    won: boolean;
    xp_earned: number;
    duration_minutes: number;
    played_at: Date;
}
