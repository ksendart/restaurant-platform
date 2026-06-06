import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthUser } from '@restaurant-platform/shared-types';
import { AuthService, AuthTokens } from './auth.service';
import {
  ACCESS_COOKIE,
  ACCESS_COOKIE_PATH,
  REFRESH_COOKIE,
  REFRESH_COOKIE_PATH,
} from './auth.cookies';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { AuthenticatedUser } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<{ user: AuthUser; accessToken: string }> {
    const { user, tokens } = await this.authService.register(dto);
    this.setAuthCookies(res, tokens);
    return { user, accessToken: tokens.accessToken };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<{ user: AuthUser; accessToken: string }> {
    const { user, tokens } = await this.authService.login(dto);
    this.setAuthCookies(res, tokens);
    return { user, accessToken: tokens.accessToken };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<{ user: AuthUser; accessToken: string }> {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token');
    }

    const { user, tokens } = await this.authService.refresh(refreshToken);
    this.setAuthCookies(res, tokens);
    return { user, accessToken: tokens.accessToken };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response
  ): Promise<void> {
    await this.authService.logout(user.id);
    this.clearAuthCookies(res);
  }

  private setAuthCookies(res: Response, tokens: AuthTokens): void {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    const sameSite = isProd ? 'none' : 'strict';
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite,
      path: REFRESH_COOKIE_PATH,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie(ACCESS_COOKIE, tokens.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite,
      path: ACCESS_COOKIE_PATH,
      maxAge: this.accessTtlMs(),
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
    res.clearCookie(ACCESS_COOKIE, { path: ACCESS_COOKIE_PATH });
  }

  private accessTtlMs(): number {
    const raw = this.configService.getOrThrow<string>('JWT_ACCESS_TTL');
    const match = /^(\d+)([smhd])$/.exec(raw.trim());
    if (!match) {
      throw new Error(`Invalid JWT_ACCESS_TTL: ${raw}`);
    }
    const value = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return value * multipliers[unit];
  }
}
