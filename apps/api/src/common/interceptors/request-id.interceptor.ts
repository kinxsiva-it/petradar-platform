import { randomUUID } from 'node:crypto';
import { tap } from 'rxjs';
import type { Observable } from 'rxjs';
import type { Request, Response } from 'express';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestIdInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAt = Date.now();
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const requestId = request.header('x-request-id') ?? randomUUID();

    response.setHeader('x-request-id', requestId);

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          JSON.stringify({
            durationMs: Date.now() - startedAt,
            method: request.method,
            path: request.originalUrl,
            requestId,
            statusCode: response.statusCode,
          }),
        );
      }),
    );
  }
}
