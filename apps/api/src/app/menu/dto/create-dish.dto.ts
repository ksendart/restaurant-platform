import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  DISH_CATEGORIES,
  DishCategory,
  PREP_TIME_MAX,
  PREP_TIME_MIN,
} from '@restaurant-platform/shared-types';

export class CreateDishDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsIn([...DISH_CATEGORIES])
  category!: DishCategory;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  imageUrl!: string;

  @IsBoolean()
  isAvailable!: boolean;

  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  ingredients!: string[];

  @IsInt()
  @Min(PREP_TIME_MIN)
  @Max(PREP_TIME_MAX)
  prepTimeMin!: number;

  @IsOptional()
  @IsInt()
  @Min(PREP_TIME_MIN)
  @Max(PREP_TIME_MAX)
  prepTimeMax!: number | null;
}
