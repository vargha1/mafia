import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
}
