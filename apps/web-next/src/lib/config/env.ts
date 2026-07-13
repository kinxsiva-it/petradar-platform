const DEFAULT_API_BASE_URL = 'http://localhost:3000/api/v1';

export const publicEnv = {
  apiBaseUrl: normalizeBaseUrl(
    process.env['NEXT_PUBLIC_API_BASE_URL'] ?? DEFAULT_API_BASE_URL,
  ),
  googleMapsApiKey: process.env['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY']?.trim() || null,
} as const;

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}
