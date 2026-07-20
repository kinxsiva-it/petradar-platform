import { ApiClientError } from '../../lib/api/http-client';

export function authErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiClientError)) {
    return fallback;
  }

  if (error.status === 0) {
    return 'The PetRadar API is unavailable. Please try again soon.';
  }

  return error.message || fallback;
}
