import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID, timingSafeEqual } from 'crypto';
import { UserRole } from '@restaurant-platform/shared-types';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUserView {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

const BCRYPT_ROUNDS = 10;
const MONGO_DUPLICATE_KEY = 11000;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async register(dto: RegisterDto): Promise<{
    user: AuthUserView;
    tokens: AuthTokens;
  }> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    let user: UserDocument;
    try {
      user = await this.usersService.create({
        email: dto.email,
        passwordHash,
        name: dto.name,
      });
    } catch (err: unknown) {
      if (this.isDuplicateKey(err)) {
        throw new ConflictException('Email already registered');
      }
      throw err;
    }

    const tokens = await this.signTokens(user);
    await this.persistRefreshHash(user.id, tokens.refreshToken);
    return { user: this.toView(user), tokens };
  }

  async login(dto: LoginDto): Promise<{
    user: AuthUserView;
    tokens: AuthTokens;
  }> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.signTokens(user);
    await this.persistRefreshHash(user.id, tokens.refreshToken);
    return { user: this.toView(user), tokens };
  }

  async refresh(presentedRefreshToken: string): Promise<{
    user: AuthUserView;
    tokens: AuthTokens;
  }> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(
        presentedRefreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        }
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findByIdWithRefreshHash(payload.sub);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (
      !this.compareRefreshHash(presentedRefreshToken, user.refreshTokenHash)
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.signTokens(user);
    await this.persistRefreshHash(user.id, tokens.refreshToken);
    return { user: this.toView(user), tokens };
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.setRefreshTokenHash(userId, null);
  }

  private async signTokens(user: UserDocument): Promise<AuthTokens> {
    const basePayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(
      { ...basePayload, jti: randomUUID() },
      {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.ttl('JWT_ACCESS_TTL'),
      }
    );

    const refreshToken = await this.jwtService.signAsync(
      { ...basePayload, jti: randomUUID() },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.ttl('JWT_REFRESH_TTL'),
      }
    );

    return { accessToken, refreshToken };
  }

  private ttl(key: 'JWT_ACCESS_TTL' | 'JWT_REFRESH_TTL'): number {
    const raw = this.configService.getOrThrow<string>(key);
    const match = /^(\d+)([smhd])$/.exec(raw.trim());
    if (!match) {
      throw new Error(`Invalid ${key}: ${raw}`);
    }
    const value = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60,
    };
    return value * multipliers[unit];
  }

  private async persistRefreshHash(
    userId: string,
    refreshToken: string
  ): Promise<void> {
    await this.usersService.setRefreshTokenHash(
      userId,
      this.hashRefreshToken(refreshToken)
    );
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private compareRefreshHash(presented: string, stored: string): boolean {
    const presentedHash = Buffer.from(this.hashRefreshToken(presented), 'hex');
    const storedHash = Buffer.from(stored, 'hex');
    if (presentedHash.length !== storedHash.length) {
      return false;
    }
    return timingSafeEqual(presentedHash, storedHash);
  }

  private toView(user: UserDocument): AuthUserView {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
  }

  private isDuplicateKey(err: unknown): boolean {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: number }).code === MONGO_DUPLICATE_KEY
    );
  }
}
