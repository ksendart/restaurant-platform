import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PingResponse } from '@restaurant/shared-types';
import { Ping } from './ping.schema';

@Injectable()
export class PingService {
  constructor(
    @InjectModel(Ping.name) private readonly pingModel: Model<Ping>
  ) {}

  async tick(): Promise<PingResponse> {
    const doc = await this.pingModel.findOneAndUpdate(
      {},
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );
    return { pong: true, count: doc.count, time: Date.now() };
  }
}
