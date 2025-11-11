"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throttlerConfig = void 0;
exports.throttlerConfig = [
    {
        name: 'auth',
        ttl: 60000,
        limit: 5,
    },
    {
        name: 'game',
        ttl: 60000,
        limit: 30,
    },
    {
        name: 'ws',
        ttl: 60000,
        limit: 600,
    },
    {
        name: 'strict',
        ttl: 300000,
        limit: 10,
    },
    {
        name: 'webrtc',
        ttl: 60000,
        limit: 1200,
    },
];
//# sourceMappingURL=throttler.config.js.map