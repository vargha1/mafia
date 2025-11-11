import { IsNotEmpty, IsString, IsInt, IsEnum, IsOptional, Min, Max } from 'class-validator';
import { GameMode } from '../entities/game.entity';

export class CreateGameDto {
  @IsNotEmpty()
  @IsString()
  room_name: string;

  @IsNotEmpty()
  @IsInt()
  @Min(4)
  @Max(20)
  max_players: number;

  @IsNotEmpty()
  @IsEnum(GameMode)
  game_mode: GameMode;

  @IsOptional()
  custom_roles?: {
    mafia: number;
    detective: number;
    doctor: number;
    sniper: number;
    citizen: number;
  };
}
