import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'ping' })
export class Ping {
  @Prop({ default: 0 })
  count!: number;
}

export type PingDocument = HydratedDocument<Ping>;
export const PingSchema = SchemaFactory.createForClass(Ping);
