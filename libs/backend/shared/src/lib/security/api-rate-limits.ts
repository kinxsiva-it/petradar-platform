import { minutes } from '@nestjs/throttler';

interface EndpointRateLimit {
  [name: string]: {
    limit: number;
    ttl: number;
  };
  default: {
    limit: number;
    ttl: number;
  };
}

function endpointRateLimit(limit: number, ttl: number): EndpointRateLimit {
  return { default: { limit, ttl } };
}

export const globalApiRateLimit = {
  limit: 180,
  name: 'default',
  ttl: minutes(1),
} as const;

export const apiRateLimits = {
  authLogin: endpointRateLimit(30, minutes(1)),
  authLogout: endpointRateLimit(30, minutes(1)),
  authRefresh: endpointRateLimit(30, minutes(1)),
  authRegister: endpointRateLimit(10, minutes(60)),
  create: endpointRateLimit(20, minutes(1)),
  matching: endpointRateLimit(10, minutes(1)),
  publicRead: endpointRateLimit(60, minutes(1)),
  upload: endpointRateLimit(10, minutes(1)),
} as const;
