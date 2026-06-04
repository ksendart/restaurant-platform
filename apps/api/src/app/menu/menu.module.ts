import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminMenuController } from './admin-menu.controller';
import { Dish, DishSchema } from './dish.schema';
import { DishSeeder } from './dish.seeder';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Dish.name, schema: DishSchema }]),
  ],
  controllers: [MenuController, AdminMenuController],
  providers: [MenuService, DishSeeder],
})
export class MenuModule {}
