import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { JwtPayload } from './auth.service';
import { ACCESS_COOKIE } from './auth.cookies';
import { AuthenticatedUser } from './jwt.strategy';

@Injectable()
export class JwtSseStrategy extends PassportStrategy(Strategy, 'jwt-sse') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: (req: Request): string | null =>
        req?.cookies?.[ACCESS_COOKIE] ?? null,
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
