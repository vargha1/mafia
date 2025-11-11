import { User } from '../../user/entities/user.entity';
import { GamePlayer } from './game-player.entity';
export declare enum GameStatus {
    WAITING = "waiting",
    IN_PROGRESS = "in_progress",
    FINISHED = "finished"
}
export declare enum GameMode {
    SIMPLE = "simple",
    COMPLETE = "complete",
    CUSTOM = "custom"
}
export declare enum GamePhase {
    LOBBY = "lobby",
    NIGHT = "night",
    DAY = "day",
    VOTING = "voting",
    RESULT = "result"
}
export declare class Game {
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
    creator: User;
    players: GamePlayer[];
    created_at: Date;
    updated_at: Date;
}
