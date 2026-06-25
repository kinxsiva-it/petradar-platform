export interface ApiErrorResponse {
  error: string;
  message: string | string[];
  path: string;
  requestId: string | null;
  statusCode: number;
  timestamp: string;
}
