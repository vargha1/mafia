import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService implements OnModuleInit {
    private userRepository;
    private jwtService;
    private readonly logger;
    constructor(userRepository: Repository<User>, jwtService: JwtService);
    onModuleInit(): Promise<void>;
    register(registerDto: RegisterDto): Promise<{
        user: {
            id: string;
            username: string;
            email: string;
            level: number;
            xp: number;
        };
        token: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        user: {
            id: string;
            username: string;
            email: string;
            level: number;
            xp: number;
            total_games: number;
            wins: number;
            losses: number;
        };
        token: string;
    }>;
    private validatePasswordComplexity;
}
