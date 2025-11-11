import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const throttlerConfig: ThrottlerModuleOptions = [
  {
    name: 'auth',
    ttl: 60000, // 1 minute
    limit: 5, // 5 requests per minute for auth endpoints
  },
  {
    name: 'game',
    ttl: 60000, // 1 minute
    limit: 30, // 30 requests per minute for game endpoints
  },
  {
    name: 'ws',
    ttl: 60000, // 1 minute
    limit: 600, // 600 events per minute for WebSocket events (10 per second)
  },
  {
    name: 'strict',
    ttl: 300000, // 5 minutes
    limit: 10, // Very strict rate limiting for sensitive operations
  },
  {
    name: 'webrtc',
    ttl: 60000, // 1 minute
    limit: 1200, // 1200 events per minute for WebRTC (20 per second)
  },
];