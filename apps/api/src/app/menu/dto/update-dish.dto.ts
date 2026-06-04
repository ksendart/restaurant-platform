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

export class UpdateDishDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @IsOptional()
  @IsIn([...DISH_CATEGORIES])
  category?: DishCategory;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  ingredients?: string[];

  @IsOptional()
  @IsInt()
  @Min(PREP_TIME_MIN)
  @Max(PREP_TIME_MAX)
  prepTimeMin?: number;

  @IsOptional()
  @IsInt()
  @Min(PREP_TIME_MIN)
  @Max(PREP_TIME_MAX)
  prepTimeMax?: number | null;
}
