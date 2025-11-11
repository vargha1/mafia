import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export declare class SecurityMiddleware implements NestMiddleware {
    private readonly logger;
    use(req: Request, res: Response, next: NextFunction): void;
    private generateCorrelationId;
}
export declare class BotDetectionMiddleware implements NestMiddleware {
    private readonly logger;
    private readonly suspiciousPatterns;
    use(req: Request, res: Response, next: NextFunction): void;
}
export declare class IPValidationMiddleware implements NestMiddleware {
    private readonly logger;
    private readonly blockedIPs;
    private readonly ipAttempts;
    use(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>>;
    private getClientIP;
}
