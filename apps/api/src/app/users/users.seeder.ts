import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { isSeedEnabled } from '../common/seed-enabled';
import { UsersService } from './users.service';

const BCRYPT_ROUNDS = 10;

interface CustomerSeed {
  email: string;
  password: string;
  name: string;
}

const CUSTOMER_SEEDS: CustomerSeed[] = [
  {
    email: 'customer1@local.test',
    password: 'Customer12345!',
    name: 'Alice',
  },
  {
    email: 'customer2@local.test',
    password: 'Customer12345!',
    name: 'Bob',
  },
  {
    email: 'customer3@local.test',
    password: 'Customer12345!',
    name: 'Carol',
  },
];

@Injectable()
export class UsersSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(UsersSeeder.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!isSeedEnabled(this.configService)) {
      this.logger.log('Seeding disabled (SEED_ENABLED=false), skipping users.');
      return;
    }
    await this.seedAdmin();
    await this.seedCustomers();
  }

  private async seedAdmin(): Promise<void> {
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

  private async seedCustomers(): Promise<void> {
    for (const seed of CUSTOMER_SEEDS) {
      const existing = await this.usersService.findByEmail(seed.email);
      if (existing) {
        continue;
      }
      const passwordHash = await bcrypt.hash(seed.password, BCRYPT_ROUNDS);
      await this.usersService.create({
        email: seed.email,
        passwordHash,
        role: 'customer',
        name: seed.name,
      });
      this.logger.log(`Customer seeded (${seed.email})`);
    }
  }
}
