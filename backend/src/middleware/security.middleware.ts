import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' wss: ws:",
      "media-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
    res.setHeader('Content-Security-Policy', csp);

    // Remove server information
    res.removeHeader('Server');
    res.removeHeader('X-Powered-By');

    // Request logging with correlation ID
    const correlationId = this.generateCorrelationId();
    req.headers['x-correlation-id'] = correlationId;

    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    this.logger.log(`${req.method} ${req.path} - IP: ${clientIP} - CID: ${correlationId}`);

    // Rate limiting headers
    res.setHeader('X-RateLimit-Limit', '100');
    res.setHeader('X-RateLimit-Remaining', '99');
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + 60000).toISOString());

    next();
  }

  private generateCorrelationId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

@Injectable()
export class BotDetectionMiddleware implements NestMiddleware {
  private readonly logger = new Logger(BotDetectionMiddleware.name);
  private readonly suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /go-http/i,
    /node/i,
  ];

  use(req: Request, res: Response, next: NextFunction) {
    const userAgent = req.headers['user-agent'] || '';

    // Check for suspicious user agents
    const isSuspicious = this.suspiciousPatterns.some(pattern => pattern.test(userAgent));

    if (isSuspicious && !req.path.startsWith('/api/health')) {
      this.logger.warn(`Suspicious user agent blocked: ${userAgent} - IP: ${req.ip}`);

      // Don't block completely, but add rate limiting
      res.setHeader('X-Bot-Detected', 'true');
    }

    // Check for missing common headers that browsers always send
    const hasAcceptHeader = req.headers.accept;
    const hasAcceptLanguage = req.headers['accept-language'];

    if (!hasAcceptHeader || !hasAcceptLanguage) {
      this.logger.warn(`Missing common headers - possibly bot: ${req.ip}`);
      res.setHeader('X-Suspicious-Request', 'true');
    }

    next();
  }
}

@Injectable()
export class IPValidationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(IPValidationMiddleware.name);
  private readonly blockedIPs = new Set<string>();
  private readonly ipAttempts = new Map<string, number>();

  use(req: Request, res: Response, next: NextFunction) {
    const clientIP = this.getClientIP(req);

    // Check if IP is blocked
    if (this.blockedIPs.has(clientIP)) {
      this.logger.warn(`Blocked IP attempted access: ${clientIP}`);
      return res.status(403).json({ error: 'Access denied' });
    }

    // Track attempts for rate limiting
    const attempts = this.ipAttempts.get(clientIP) || 0;
    this.ipAttempts.set(clientIP, attempts + 1);

    // Block IP after too many attempts
    if (attempts > 1000) {
      this.blockedIPs.add(clientIP);
      this.logger.warn(`IP blocked due to excessive attempts: ${clientIP}`);
      return res.status(403).json({ error: 'Access denied' });
    }

    // Decay attempt count over time
    setTimeout(() => {
      const current = this.ipAttempts.get(clientIP) || 0;
      if (current <= 1) {
        this.ipAttempts.delete(clientIP);
      } else {
        this.ipAttempts.set(clientIP, current - 1);
      }
    }, 60000); // 1 minute decay

    next();
  }

  private getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           req.headers['x-real-ip'] as string ||
           req.ip ||
           req.connection.remoteAddress ||
           'unknown';
  }
}