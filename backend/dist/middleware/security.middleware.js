"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SecurityMiddleware_1, BotDetectionMiddleware_1, IPValidationMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPValidationMiddleware = exports.BotDetectionMiddleware = exports.SecurityMiddleware = void 0;
const common_1 = require("@nestjs/common");
let SecurityMiddleware = SecurityMiddleware_1 = class SecurityMiddleware {
    constructor() {
        this.logger = new common_1.Logger(SecurityMiddleware_1.name);
    }
    use(req, res, next) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
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
        res.removeHeader('Server');
        res.removeHeader('X-Powered-By');
        const correlationId = this.generateCorrelationId();
        req.headers['x-correlation-id'] = correlationId;
        const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
        this.logger.log(`${req.method} ${req.path} - IP: ${clientIP} - CID: ${correlationId}`);
        res.setHeader('X-RateLimit-Limit', '100');
        res.setHeader('X-RateLimit-Remaining', '99');
        res.setHeader('X-RateLimit-Reset', new Date(Date.now() + 60000).toISOString());
        next();
    }
    generateCorrelationId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
};
exports.SecurityMiddleware = SecurityMiddleware;
exports.SecurityMiddleware = SecurityMiddleware = SecurityMiddleware_1 = __decorate([
    (0, common_1.Injectable)()
], SecurityMiddleware);
let BotDetectionMiddleware = BotDetectionMiddleware_1 = class BotDetectionMiddleware {
    constructor() {
        this.logger = new common_1.Logger(BotDetectionMiddleware_1.name);
        this.suspiciousPatterns = [
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
    }
    use(req, res, next) {
        const userAgent = req.headers['user-agent'] || '';
        const isSuspicious = this.suspiciousPatterns.some(pattern => pattern.test(userAgent));
        if (isSuspicious && !req.path.startsWith('/api/health')) {
            this.logger.warn(`Suspicious user agent blocked: ${userAgent} - IP: ${req.ip}`);
            res.setHeader('X-Bot-Detected', 'true');
        }
        const hasAcceptHeader = req.headers.accept;
        const hasAcceptLanguage = req.headers['accept-language'];
        if (!hasAcceptHeader || !hasAcceptLanguage) {
            this.logger.warn(`Missing common headers - possibly bot: ${req.ip}`);
            res.setHeader('X-Suspicious-Request', 'true');
        }
        next();
    }
};
exports.BotDetectionMiddleware = BotDetectionMiddleware;
exports.BotDetectionMiddleware = BotDetectionMiddleware = BotDetectionMiddleware_1 = __decorate([
    (0, common_1.Injectable)()
], BotDetectionMiddleware);
let IPValidationMiddleware = IPValidationMiddleware_1 = class IPValidationMiddleware {
    constructor() {
        this.logger = new common_1.Logger(IPValidationMiddleware_1.name);
        this.blockedIPs = new Set();
        this.ipAttempts = new Map();
    }
    use(req, res, next) {
        const clientIP = this.getClientIP(req);
        if (this.blockedIPs.has(clientIP)) {
            this.logger.warn(`Blocked IP attempted access: ${clientIP}`);
            return res.status(403).json({ error: 'Access denied' });
        }
        const attempts = this.ipAttempts.get(clientIP) || 0;
        this.ipAttempts.set(clientIP, attempts + 1);
        if (attempts > 1000) {
            this.blockedIPs.add(clientIP);
            this.logger.warn(`IP blocked due to excessive attempts: ${clientIP}`);
            return res.status(403).json({ error: 'Access denied' });
        }
        setTimeout(() => {
            const current = this.ipAttempts.get(clientIP) || 0;
            if (current <= 1) {
                this.ipAttempts.delete(clientIP);
            }
            else {
                this.ipAttempts.set(clientIP, current - 1);
            }
        }, 60000);
        next();
    }
    getClientIP(req) {
        return req.headers['x-forwarded-for']?.split(',')[0] ||
            req.headers['x-real-ip'] ||
            req.ip ||
            req.connection.remoteAddress ||
            'unknown';
    }
};
exports.IPValidationMiddleware = IPValidationMiddleware;
exports.IPValidationMiddleware = IPValidationMiddleware = IPValidationMiddleware_1 = __decorate([
    (0, common_1.Injectable)()
], IPValidationMiddleware);
//# sourceMappingURL=security.middleware.js.map