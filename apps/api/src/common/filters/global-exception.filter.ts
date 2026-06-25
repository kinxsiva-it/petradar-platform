import type { Request, Response } from 'express';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

interface ErrorBody {
  error: string;
  message: string | string[];
  path: string;
  requestId: string | null;
  statusCode: number;
  timestamp: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const requestIdHeader = response.getHeader('x-request-id');
    const requestId = typeof requestIdHeader === 'string' ? requestIdHeader : null;

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    const internalServerErrorStatus: number = HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      typeof exceptionResponse === 'object' && 'message' in exceptionResponse
        ? (exceptionResponse as { message: string | string[] }).message
        : statusCode === internalServerErrorStatus
          ? 'An unexpected error occurred.'
          : 'Request failed.';

    const body: ErrorBody = {
      error: exception instanceof Error ? exception.name : 'Error',
      message,
      path: request.originalUrl,
      requestId,
      statusCode,
      timestamp: new Date().toISOString(),
    };

    this.logger.error(
      JSON.stringify({
        error: body.error,
        method: request.method,
        path: request.originalUrl,
        requestId,
        statusCode,
      }),
    );
    response.status(statusCode).json(body);
  }
}
