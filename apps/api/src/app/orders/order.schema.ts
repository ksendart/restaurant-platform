import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ORDER_STATUSES, OrderStatus } from '@restaurant-platform/shared-types';

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, required: true })
  dishId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ required: true, min: 1 })
  count!: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class OrderContactEmbedded {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true })
  phone!: string;

  @Prop({ required: true, trim: true, lowercase: true })
  email!: string;
}

export const OrderContactSchema =
  SchemaFactory.createForClass(OrderContactEmbedded);

@Schema({ collection: 'orders', timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], required: true })
  items!: OrderItem[];

  @Prop({ type: OrderContactSchema, required: true })
  contact!: OrderContactEmbedded;

  @Prop({ required: true, trim: true })
  pickupSlot!: string;

  @Prop({ required: true, min: 0 })
  total!: number;

  @Prop({
    type: String,
    required: true,
    enum: ORDER_STATUSES,
    default: 'pending',
  })
  status!: OrderStatus;
}

export type OrderDocument = HydratedDocument<Order>;
export const OrderSchema = SchemaFactory.createForClass(Order);
