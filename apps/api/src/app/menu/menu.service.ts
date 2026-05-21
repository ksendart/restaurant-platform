import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DishDto } from '@restaurant-platform/shared-types';
import { Dish, DishDocument } from './dish.schema';

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(Dish.name) private readonly dishModel: Model<Dish>
  ) {}

  async findAll(): Promise<DishDto[]> {
    const docs = await this.dishModel.find({ isArchived: false }).lean().exec();
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
  };
}
