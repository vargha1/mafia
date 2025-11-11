import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { GamePlayer } from '../../game/entities/game-player.entity';
import { GameHistory } from '../../game/entities/game-history.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    unique: true,
    length: 50,
    comment: 'Unique username for the user'
  })
  @Index()
  username: string;

  @Column({
    unique: true,
    length: 255,
    comment: 'Unique email address for the user'
  })
  @Index()
  email: string;

  @Column({
    length: 255,
    comment: 'Hashed password using bcrypt'
  })
  password: string;

  @Column({
    type: 'int',
    default: 1,
    comment: 'User level based on experience'
  })
  level: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Experience points earned by user'
  })
  xp: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Total games played'
  })
  total_games: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Total games won'
  })
  wins: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Total games lost'
  })
  losses: number;

  @Column({ default: 0 })
  failed_login_attempts: number;

  @Column({ nullable: true })
  locked_until: Date;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => GamePlayer, (gamePlayer) => gamePlayer.user)
  game_players: GamePlayer[];

  @OneToMany(() => GameHistory, (history) => history.user)
  game_history: GameHistory[];
}
