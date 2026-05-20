import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PingModule } from './ping/ping.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI ?? 'mongodb://localhost:27017/restaurant',
    ),
    PingModule,
  ],
})
export class AppModule {}
