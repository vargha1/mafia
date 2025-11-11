import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { PlayerRole } from './game-player.entity';

@Entity('game_history')
export class GameHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', {
    comment: 'Reference to the user'
  })
  @Index()
  user_id: string;

  @Column('uuid', {
    comment: 'Reference to the game'
  })
  @Index()
  game_id: string;

  @ManyToOne(() => User, (user) => user.game_history)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: PlayerRole,
  })
  role: PlayerRole;

  @Column()
  won: boolean;

  @Column({ type: 'int' })
  xp_earned: number;

  @Column({ type: 'int' })
  duration_minutes: number;

  @CreateDateColumn()
  played_at: Date;
}
