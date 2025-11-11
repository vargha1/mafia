import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { GamePlayer } from './game-player.entity';

export enum GameStatus {
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
}

export enum GameMode {
  SIMPLE = 'simple',
  COMPLETE = 'complete',
  CUSTOM = 'custom',
}

export enum GamePhase {
  LOBBY = 'lobby',
  NIGHT = 'night',
  DAY = 'day',
  VOTING = 'voting',
  RESULT = 'result',
}

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  room_name: string;

  @Column({ type: 'int' })
  max_players: number;

  @Column({ type: 'int', default: 0 })
  current_players: number;

  @Column({
    type: 'enum',
    enum: GameMode,
    default: GameMode.SIMPLE,
  })
  game_mode: GameMode;

  @Column({
    type: 'enum',
    enum: GameStatus,
    default: GameStatus.WAITING,
  })
  status: GameStatus;

  @Column({
    type: 'enum',
    enum: GamePhase,
    default: GamePhase.LOBBY,
  })
  phase: GamePhase;

  @Column({ type: 'jsonb', nullable: true })
  custom_roles: any;

  @Column({ type: 'int', default: 1 })
  day_number: number;

  @Column({ nullable: true })
  winner: string; // 'mafia' or 'citizen'

  @Column('uuid')
  created_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => GamePlayer, (player) => player.game)
  players: GamePlayer[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
