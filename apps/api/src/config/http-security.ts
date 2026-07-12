import type { HelmetOptions } from 'helmet';

import type { Env } from './env.schema.js';

type HttpSecurityEnv = Pick<Env, 'API_DOCS_ENABLED' | 'NODE_ENV'>;

export const jsonBodyLimit = '1mb';
export const urlEncodedBodyLimit = '1mb';

export function shouldEnableApiDocs(env: HttpSecurityEnv): boolean {
  return env.NODE_ENV !== 'production' || env.API_DOCS_ENABLED;
}

export function helmetOptions(env: HttpSecurityEnv): HelmetOptions {
  const options: HelmetOptions = {
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    strictTransportSecurity:
      env.NODE_ENV === 'production'
        ? { includeSubDomains: true, maxAge: 31_536_000, preload: false }
        : false,
  };

  if (shouldEnableApiDocs(env)) {
    options.contentSecurityPolicy = {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    };
  }

  return options;
}
