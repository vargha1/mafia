import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...profile } = user;
    return profile;
  }

  async getLeaderboard(limit: number = 50) {
    const users = await this.userRepository.find({
      order: { xp: 'DESC' },
      take: limit,
      select: ['id', 'username', 'level', 'xp', 'total_games', 'wins', 'losses'],
    });

    return users.map((user, index) => ({
      rank: index + 1,
      ...user,
      win_rate: user.total_games > 0 ? ((user.wins / user.total_games) * 100).toFixed(1) : '0.0',
    }));
  }

  async updateUserStats(userId: string, won: boolean, xpEarned: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.total_games += 1;
    user.xp += xpEarned;
    
    if (won) {
      user.wins += 1;
    } else {
      user.losses += 1;
    }

    // Level up logic
    const newLevel = Math.floor(user.xp / 1000) + 1;
    if (newLevel > user.level) {
      user.level = newLevel;
    }

    await this.userRepository.save(user);
    return user;
  }
}
