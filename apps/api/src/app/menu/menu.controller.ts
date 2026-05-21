import { Controller, Get, Param } from '@nestjs/common';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';
import { MenuService } from './menu.service';
import { DishDto } from '@restaurant-platform/shared-types';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  findAll(): Promise<DishDto[]> {
    return this.menuService.findAll();
  }

  @Get(':id')
  findById(@Param('id', ParseObjectIdPipe) id: string): Promise<DishDto> {
    return this.menuService.findById(id);
  }
}
