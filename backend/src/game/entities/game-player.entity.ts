import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Game } from './game.entity';

export enum PlayerRole {
  MAFIA = 'mafia',
  CITIZEN = 'citizen',
  DETECTIVE = 'detective',
  DOCTOR = 'doctor',
  SNIPER = 'sniper',
}

@Entity('game_players')
export class GamePlayer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  game_id: string;

  @Column('uuid')
  user_id: string;

  @ManyToOne(() => Game, (game) => game.players)
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @ManyToOne(() => User, (user) => user.game_players)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: PlayerRole,
    nullable: true,
  })
  role: PlayerRole;

  @Column({ default: true })
  is_alive: boolean;

  @Column({ default: 0 })
  votes_received: number;

  @Column({ default: false })
  is_ready: boolean;

  @CreateDateColumn()
  joined_at: Date;
}
