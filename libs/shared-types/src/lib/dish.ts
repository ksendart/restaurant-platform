export const DISH_CATEGORIES = ['starter', 'main', 'dessert', 'drink'] as const;
export type DishCategory = (typeof DISH_CATEGORIES)[number];

export interface DishDto {
  id: string;
  name: string;
  description: string;
  price: number;
  category: DishCategory;
  imageUrl: string;
  isAvailable: boolean;
}
