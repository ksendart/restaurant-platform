import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const email = this.configService.get<string>('ADMIN_EMAIL')?.trim();
    const password = this.configService.get<string>('ADMIN_PASSWORD');

    if (!email || !password) {
      this.logger.warn(
        'Admin seed skipped: ADMIN_EMAIL or ADMIN_PASSWORD not set'
      );
      return;
    }

    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      if (existing.role !== 'admin') {
        this.logger.warn(
          `Admin seed skipped: user ${email} exists with role "${existing.role}", not promoting automatically`
        );
        return;
      }
      this.logger.log(`Admin already exists (${email})`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await this.usersService.create({
      email,
      passwordHash,
      role: 'admin',
      name: 'Admin',
    });
    this.logger.log(`Admin seeded (${email})`);
  }
}
