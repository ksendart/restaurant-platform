import { Controller, Get } from '@nestjs/common';
import { PingService } from './ping.service';

@Controller('ping')
export class PingController {
  constructor(private readonly ping: PingService) {}

  @Get()
  tick() {
    return this.ping.tick();
  }
}
