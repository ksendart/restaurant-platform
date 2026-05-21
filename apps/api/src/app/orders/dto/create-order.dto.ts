import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsMongoId,
  IsNumber,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

const PICKUP_SLOT_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const PHONE_PATTERN = /^\+?[0-9 ]{7,15}$/;

export class OrderItemInput {
  @IsMongoId()
  dishId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsInt()
  @Min(1)
  count!: number;
}

export class OrderContactInput {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @Matches(PHONE_PATTERN, { message: 'Invalid phone format' })
  phone!: string;

  @IsEmail()
  email!: string;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInput)
  items!: OrderItemInput[];

  @ValidateNested()
  @Type(() => OrderContactInput)
  contact!: OrderContactInput;

  @Matches(PICKUP_SLOT_PATTERN, { message: 'Invalid pickup slot format' })
  pickupSlot!: string;
}
