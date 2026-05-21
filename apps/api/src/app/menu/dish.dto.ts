import { DishCategory } from './dish.schema';

export interface DishDTO {
  id: string;
  name: string;
  description: string;
  price: number;
  category: DishCategory;
  imageUrl: string;
  isAvailable: boolean;
}
