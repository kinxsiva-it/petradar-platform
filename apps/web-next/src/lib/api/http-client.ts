import { publicEnv } from '../config/env';

export interface ApiErrorShape {
  error?: string;
  message?: string | string[];
  path?: string;
  requestId?: string | null;
  statusCode?: number;
  timestamp?: string;
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  accessToken?: string | null;
  body?: BodyInit | null;
  json?: unknown;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details: ApiErrorShape | null,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { accessToken, body, headers: initialHeaders, json, ...requestInit } = options;
  const headers = new Headers(initialHeaders);
  headers.set('Accept', 'application/json');

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  if (json !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(apiUrl(path), {
    ...requestInit,
    body: json === undefined ? body : JSON.stringify(json),
    cache: requestInit.cache ?? 'no-store',
    credentials: 'include',
    headers,
  });
  const payload = await readPayload(response);

  if (!response.ok) {
    const details = isApiErrorShape(payload) ? payload : null;
    throw new ApiClientError(errorMessage(details, response.status), response.status, details);
  }

  return payload as T;
}

function apiUrl(path: string): string {
  return `${publicEnv.apiBaseUrl}/${path.replace(/^\/+/, '')}`;
}

async function readPayload(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';
  return contentType.includes('application/json') ? response.json() : response.text();
}

function isApiErrorShape(value: unknown): value is ApiErrorShape {
  return typeof value === 'object' && value !== null;
}

function errorMessage(details: ApiErrorShape | null, status: number): string {
  const message = details?.message;
  if (Array.isArray(message)) {
    return message.join(' ');
  }
  return typeof message === 'string' ? message : `PetRadar API request failed (${String(status)}).`;
}
