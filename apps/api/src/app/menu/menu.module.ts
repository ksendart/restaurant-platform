import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Dish, DishSchema } from './dish.schema';
import { DishSeeder } from './dish.seeder';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Dish.name, schema: DishSchema }]),
  ],
  providers: [DishSeeder],
})
export class MenuModule {}
