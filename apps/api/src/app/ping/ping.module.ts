import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Ping, PingSchema } from './ping.schema';
import { PingController } from './ping.controller';
import { PingService } from './ping.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Ping.name, schema: PingSchema }])],
  controllers: [PingController],
  providers: [PingService],
})
export class PingModule {}
