import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  DISH_CATEGORIES,
  DishCategory,
  PREP_TIME_MAX,
  PREP_TIME_MIN,
} from '@restaurant-platform/shared-types';

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

  @Prop({ type: [String], default: [] })
  ingredients!: string[];

  @Prop({ required: true, min: PREP_TIME_MIN, max: PREP_TIME_MAX })
  prepTimeMin!: number;

  @Prop({ type: Number, default: null, min: PREP_TIME_MIN, max: PREP_TIME_MAX })
  prepTimeMax!: number | null;
}

export type DishDocument = HydratedDocument<Dish>;
export const DishSchema = SchemaFactory.createForClass(Dish);
