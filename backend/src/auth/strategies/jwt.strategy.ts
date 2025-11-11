import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required for security');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    // Check token expiration time
    const now = Date.now() / 1000;
    if (payload.exp && payload.exp < now) {
      this.logger.warn(`Token expired for user ${payload.sub}`);
      throw new UnauthorizedException('Token has expired');
    }

    // Validate required payload fields
    if (!payload.sub || !payload.email) {
      this.logger.warn('Invalid token payload structure');
      throw new UnauthorizedException('Invalid token structure');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      this.logger.warn(`User not found for token payload: ${payload.sub}`);
      throw new UnauthorizedException('User not found');
    }

    // Check if user account is active (assuming there's an isActive field)
    if (user.isActive === false) {
      this.logger.warn(`Inactive user attempted access: ${user.id}`);
      throw new UnauthorizedException('Account is deactivated');
    }

    return user;
  }
}
