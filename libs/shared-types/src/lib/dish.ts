export const DISH_CATEGORIES = ['starter', 'main', 'dessert', 'drink'] as const;
export type DishCategory = (typeof DISH_CATEGORIES)[number];

export const PREP_TIME_MIN = 5;
export const PREP_TIME_MAX = 90;
export const PREP_TIME_STEP = 5;

export interface DishDto {
  id: string;
  name: string;
  description: string;
  price: number;
  category: DishCategory;
  imageUrl: string;
  isAvailable: boolean;
  ingredients: string[];
  prepTimeMin: number;
  prepTimeMax: number | null;
}

export interface AdminDishDto extends DishDto {
  isArchived: boolean;
}

export interface CreateDishRequest {
  name: string;
  description: string;
  price: number;
  category: DishCategory;
  imageUrl: string;
  isAvailable: boolean;
  ingredients: string[];
  prepTimeMin: number;
  prepTimeMax: number | null;
}

export type UpdateDishRequest = Partial<CreateDishRequest>;

export interface SetDishArchivedRequest {
  isArchived: boolean;
}
