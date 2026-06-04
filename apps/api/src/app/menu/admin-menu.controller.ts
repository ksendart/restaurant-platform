import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminDishDto } from '@restaurant-platform/shared-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';
import { CreateDishDto } from './dto/create-dish.dto';
import { SetDishArchivedDto } from './dto/set-dish-archived.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { MenuService } from './menu.service';

@Controller('admin/menu')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(['admin'])
export class AdminMenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  list(): Promise<AdminDishDto[]> {
    return this.menuService.findAllForAdmin();
  }

  @Post()
  create(@Body() dto: CreateDishDto): Promise<AdminDishDto> {
    return this.menuService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateDishDto
  ): Promise<AdminDishDto> {
    return this.menuService.update(id, dto);
  }

  @Patch(':id/archive')
  setArchived(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: SetDishArchivedDto
  ): Promise<AdminDishDto> {
    return this.menuService.setArchived(id, dto.isArchived);
  }
}
