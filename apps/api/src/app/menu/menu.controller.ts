import { Controller, Get, Param } from '@nestjs/common';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';
import { MenuService } from './menu.service';
import { DishDTO } from './dish.dto';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  findAll(): Promise<DishDTO[]> {
    return this.menuService.findAll();
  }

  @Get(':id')
  findById(@Param('id', ParseObjectIdPipe) id: string): Promise<DishDTO> {
    return this.menuService.findById(id);
  }
}
