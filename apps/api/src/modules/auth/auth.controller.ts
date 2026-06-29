import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { CookieOptions, Request, Response } from 'express';

import {
  AuthService,
  CurrentUser,
  JwtAuthGuard,
  type AuthenticatedSession,
  type AuthenticatedUser,
  type SafeUserResponse,
} from '@petradar/backend/auth';

import type { Env } from '../../config/env.schema.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

type RequestWithCookies = Omit<Request, 'cookies'> & {
  cookies: Record<string, string | undefined>;
};

interface AuthResponse {
  accessToken: string;
  expiresInSeconds: number;
  user: SafeUserResponse;
}

interface LogoutResponse {
  success: true;
}

const refreshCookieName = 'petradar_refresh_token';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Post('register')
  @ApiOkResponse({ description: 'Register a user and start a session.' })
  async register(
    @Body() body: RegisterDto,
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const session = await this.auth.register(
      {
        displayName: body.displayName,
        email: body.email,
        password: body.password,
        phone: body.phone,
      },
      this.contextFromRequest(request),
    );

    this.setRefreshCookie(response, session);
    return this.toAuthResponse(session);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Authenticate and start a session.' })
  async login(
    @Body() body: LoginDto,
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const session = await this.auth.login(body, this.contextFromRequest(request));

    this.setRefreshCookie(response, session);
    return this.toAuthResponse(session);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Rotate the refresh token and return a new access token.' })
  async refresh(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponse> {
    const refreshToken = this.refreshTokenFromRequest(request);
    const session = await this.auth.refresh(refreshToken, this.contextFromRequest(request));

    this.setRefreshCookie(response, session);
    return this.toAuthResponse(session);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Revoke the current refresh token.' })
  async logout(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LogoutResponse> {
    const refreshToken = request.cookies[refreshCookieName];
    await this.auth.logout(refreshToken, this.contextFromRequest(request));
    this.clearRefreshCookie(response);
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Return the authenticated user.' })
  me(@CurrentUser() user: AuthenticatedUser | undefined): Promise<SafeUserResponse> {
    if (!user) {
      throw new UnauthorizedException('Authentication required.');
    }

    return this.auth.currentUser(user.id);
  }

  private toAuthResponse(session: AuthenticatedSession): AuthResponse {
    return {
      accessToken: session.accessToken,
      expiresInSeconds: session.expiresInSeconds,
      user: session.user,
    };
  }

  private refreshTokenFromRequest(request: RequestWithCookies): string {
    const refreshToken = request.cookies[refreshCookieName];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required.');
    }

    return refreshToken;
  }

  private setRefreshCookie(response: Response, session: AuthenticatedSession): void {
    response.cookie(refreshCookieName, session.refreshToken, {
      ...this.refreshCookieOptions(),
      expires: session.refreshExpiresAt,
    });
  }

  private clearRefreshCookie(response: Response): void {
    response.clearCookie(refreshCookieName, this.refreshCookieOptions());
  }

  private refreshCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      path: this.authCookiePath(),
      sameSite: 'lax',
      secure: this.config.get('NODE_ENV', { infer: true }) === 'production',
    };
  }

  private authCookiePath(): string {
    const prefix = this.config.get('API_PREFIX', { infer: true }).replace(/^\/|\/$/g, '');
    return `/${prefix}/auth`;
  }

  private contextFromRequest(request: Request): {
    ip?: string | null;
    requestId?: string | null;
    userAgent?: string | null;
  } {
    const requestId = request.header('x-request-id');
    return {
      ip: request.ip,
      requestId: requestId ?? null,
      userAgent: request.header('user-agent') ?? null,
    };
  }
}
