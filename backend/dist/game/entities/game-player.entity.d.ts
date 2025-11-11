import { User } from '../../user/entities/user.entity';
import { Game } from './game.entity';
export declare enum PlayerRole {
    MAFIA = "mafia",
    CITIZEN = "citizen",
    DETECTIVE = "detective",
    DOCTOR = "doctor",
    SNIPER = "sniper"
}
export declare class GamePlayer {
    id: string;
    game_id: string;
    user_id: string;
    game: Game;
    user: User;
    role: PlayerRole;
    is_alive: boolean;
    votes_received: number;
    is_ready: boolean;
    joined_at: Date;
}
