import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Dish, DishDocument } from './dish.schema';
import { DishDTO } from './dish.dto';

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(Dish.name) private readonly dishModel: Model<Dish>
  ) {}

  async findAll(): Promise<DishDTO[]> {
    const docs = await this.dishModel.find({ isArchived: false }).lean().exec();
    return docs.map(toDto);
  }

  async findById(id: string): Promise<DishDTO> {
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

function toDto(doc: LeanDish): DishDTO {
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
