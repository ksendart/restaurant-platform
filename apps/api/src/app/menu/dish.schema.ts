import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export const DISH_CATEGORIES = ['starter', 'main', 'dessert', 'drink'] as const;
export type DishCategory = (typeof DISH_CATEGORIES)[number];

@Schema({ collection: 'dishes', timestamps: true })
export class Dish {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ type: String, required: true, enum: DISH_CATEGORIES })
  category!: DishCategory;

  @Prop({ required: true, trim: true })
  imageUrl!: string;

  @Prop({ default: true })
  isAvailable!: boolean;

  @Prop({ default: false })
  isArchived!: boolean;
}

export type DishDocument = HydratedDocument<Dish>;
export const DishSchema = SchemaFactory.createForClass(Dish);
