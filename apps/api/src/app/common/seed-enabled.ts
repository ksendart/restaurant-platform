import { ConfigService } from '@nestjs/config';

export function isSeedEnabled(configService: ConfigService): boolean {
  const raw = configService.get<string>('SEED_ENABLED');
  if (raw === undefined) {
    return true;
  }
  return raw.trim().toLowerCase() !== 'false';
}
