import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../user/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, email, password } = registerDto;

    // Password complexity validation
    if (!this.validatePasswordComplexity(password)) {
      throw new ConflictException('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      failed_login_attempts: 0,
      is_active: true,
    });

    await this.userRepository.save(user);

    // Generate JWT token
    const payload = { sub: user.id, username: user.username };
    const token = this.jwtService.sign(payload);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        level: user.level,
        xp: user.xp,
      },
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // Find user
    const user = await this.userRepository.findOne({ where: { username } });

    if (!user) {
      // Use generic error message to prevent user enumeration
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.locked_until && user.locked_until > new Date()) {
      const remainingTime = Math.ceil((user.locked_until.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(`Account locked. Try again in ${remainingTime} minutes.`);
    }

    // Check if account is active
    if (!user.is_active) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const updatedAttempts = (user.failed_login_attempts || 0) + 1;
      const maxAttempts = 5;

      if (updatedAttempts >= maxAttempts) {
        // Lock account for 15 minutes
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        await this.userRepository.update(user.id, {
          failed_login_attempts: updatedAttempts,
          locked_until: lockUntil,
        });
        throw new UnauthorizedException(`Too many failed attempts. Account locked for 15 minutes.`);
      } else {
        // Increment failed attempts
        await this.userRepository.update(user.id, {
          failed_login_attempts: updatedAttempts,
        });
        const remainingAttempts = maxAttempts - updatedAttempts;
        throw new UnauthorizedException(`Invalid credentials. ${remainingAttempts} attempts remaining.`);
      }
    }

    // Successful login - reset failed attempts and clear lock
    await this.userRepository.update(user.id, {
      failed_login_attempts: 0,
      locked_until: null,
    });

    // Reload user to get updated data
    const updatedUser = await this.userRepository.findOne({ where: { username } });

    // Generate JWT token
    const payload = { sub: user.id, username: user.username, email: user.email };
    const token = this.jwtService.sign(payload);

    return {
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        level: updatedUser.level,
        xp: updatedUser.xp,
        total_games: updatedUser.total_games,
        wins: updatedUser.wins,
        losses: updatedUser.losses,
      },
      token,
    };
  }

  private validatePasswordComplexity(password: string): boolean {
    // At least 8 characters, uppercase, lowercase, number, and special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }
}
