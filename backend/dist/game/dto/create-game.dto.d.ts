import { GameMode } from '../entities/game.entity';
export declare class CreateGameDto {
    room_name: string;
    max_players: number;
    game_mode: GameMode;
    custom_roles?: {
        mafia: number;
        detective: number;
        doctor: number;
        sniper: number;
        citizen: number;
    };
}
