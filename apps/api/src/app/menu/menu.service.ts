import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AdminDishDto,
  CreateDishRequest,
  DishDto,
  UpdateDishRequest,
} from '@restaurant-platform/shared-types';
import { Dish, DishDocument } from './dish.schema';

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(Dish.name) private readonly dishModel: Model<Dish>
  ) {}

  async findAll(): Promise<DishDto[]> {
    const docs = await this.dishModel
      .find({ isArchived: false })
      .sort({ category: 1, name: 1 })
      .lean()
      .exec();
    return docs.map(toDto);
  }

  async findById(id: string): Promise<DishDto> {
    const doc = await this.dishModel
      .findOne({ _id: id, isArchived: false })
      .lean()
      .exec();
    if (!doc) {
      throw new NotFoundException(`Dish ${id} not found`);
    }
    return toDto(doc);
  }

  async findAllForAdmin(): Promise<AdminDishDto[]> {
    const docs = await this.dishModel
      .find()
      .sort({ isArchived: 1, category: 1, name: 1 })
      .lean()
      .exec();
    return docs.map(toAdminDto);
  }

  async create(input: CreateDishRequest): Promise<AdminDishDto> {
    assertPrepTimeRange(input.prepTimeMin, input.prepTimeMax);
    const created = await this.dishModel.create({
      ...input,
      ingredients: normalizeIngredients(input.ingredients),
      isArchived: false,
    });
    return toAdminDto(created.toObject());
  }

  async update(id: string, input: UpdateDishRequest): Promise<AdminDishDto> {
    const next: Record<string, unknown> = { ...input };
    if (input.ingredients) {
      next['ingredients'] = normalizeIngredients(input.ingredients);
    }
    const prepMinTouched = 'prepTimeMin' in input;
    const prepMaxTouched = 'prepTimeMax' in input;
    if (prepMinTouched || prepMaxTouched) {
      const existing = await this.dishModel.findById(id).lean().exec();
      if (!existing) {
        throw new NotFoundException(`Dish ${id} not found`);
      }
      assertPrepTimeRange(
        prepMinTouched ? (input.prepTimeMin as number) : existing.prepTimeMin,
        prepMaxTouched ? input.prepTimeMax ?? null : existing.prepTimeMax
      );
    }
    const updated = await this.dishModel
      .findByIdAndUpdate(id, next, { new: true, runValidators: true })
      .lean()
      .exec();
    if (!updated) {
      throw new NotFoundException(`Dish ${id} not found`);
    }
    return toAdminDto(updated);
  }

  async setArchived(id: string, isArchived: boolean): Promise<AdminDishDto> {
    const updated = await this.dishModel
      .findByIdAndUpdate(id, { isArchived }, { new: true })
      .lean()
      .exec();
    if (!updated) {
      throw new NotFoundException(`Dish ${id} not found`);
    }
    return toAdminDto(updated);
  }
}

function normalizeIngredients(raw: readonly string[]): string[] {
  return raw.map((s) => s.trim()).filter((s) => s.length > 0);
}

function assertPrepTimeRange(min: number, max: number | null): void {
  if (max !== null && max < min) {
    throw new BadRequestException('prepTimeMax must be >= prepTimeMin');
  }
}

type LeanDish = Pick<
  DishDocument,
  | '_id'
  | 'name'
  | 'description'
  | 'price'
  | 'category'
  | 'imageUrl'
  | 'isAvailable'
  | 'isArchived'
  | 'ingredients'
  | 'prepTimeMin'
  | 'prepTimeMax'
>;

function toDto(doc: LeanDish): DishDto {
  return {
    id: String(doc._id),
    name: doc.name,
    description: doc.description,
    price: doc.price,
    category: doc.category,
    imageUrl: doc.imageUrl,
    isAvailable: doc.isAvailable,
    ingredients: doc.ingredients ?? [],
    prepTimeMin: doc.prepTimeMin,
    prepTimeMax: doc.prepTimeMax ?? null,
  };
}

function toAdminDto(doc: LeanDish): AdminDishDto {
  return {
    ...toDto(doc),
    isArchived: doc.isArchived,
  };
}
