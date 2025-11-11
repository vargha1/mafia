import { GamePlayer } from '../../game/entities/game-player.entity';
import { GameHistory } from '../../game/entities/game-history.entity';
export declare class User {
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
    game_players: GamePlayer[];
    game_history: GameHistory[];
}
