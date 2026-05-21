import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DishCategory } from '@restaurant/shared-types';
import { Dish } from './dish.schema';

type DishSeed = {
  name: string;
  description: string;
  price: number;
  category: DishCategory;
};

const SEED_DISHES: DishSeed[] = [
  {
    name: 'Bruschetta Pomodoro',
    description: 'Toasted bread, ripe tomatoes, basil, garlic, olive oil.',
    price: 7.5,
    category: 'starter',
  },
  {
    name: 'Caesar Salad',
    description:
      'Romaine, parmesan shavings, croutons, classic Caesar dressing.',
    price: 9.9,
    category: 'starter',
  },
  {
    name: 'Burrata with Heirloom Tomatoes',
    description: 'Creamy burrata, heirloom tomatoes, aged balsamic, basil oil.',
    price: 12.5,
    category: 'starter',
  },
  {
    name: 'Margherita Pizza',
    description:
      'San Marzano tomato, fior di latte, basil, extra-virgin olive oil.',
    price: 13.0,
    category: 'main',
  },
  {
    name: 'Spaghetti Carbonara',
    description: 'Guanciale, egg yolk, pecorino romano, cracked black pepper.',
    price: 14.5,
    category: 'main',
  },
  {
    name: 'Grilled Salmon',
    description: 'Atlantic salmon, lemon-dill butter, seasonal vegetables.',
    price: 21.0,
    category: 'main',
  },
  {
    name: 'Ribeye Steak',
    description: '300g aged ribeye, rosemary butter, roasted potatoes.',
    price: 28.0,
    category: 'main',
  },
  {
    name: 'Mushroom Risotto',
    description: 'Arborio rice, porcini, parmesan, white wine, truffle oil.',
    price: 16.5,
    category: 'main',
  },
  {
    name: 'Tiramisu',
    description: 'Mascarpone, espresso-soaked savoiardi, cocoa dust.',
    price: 7.0,
    category: 'dessert',
  },
  {
    name: 'Panna Cotta',
    description: 'Vanilla cream, fresh berries, mint.',
    price: 6.5,
    category: 'dessert',
  },
  {
    name: 'Chocolate Fondant',
    description: 'Warm dark chocolate cake, molten center, vanilla ice cream.',
    price: 8.0,
    category: 'dessert',
  },
  {
    name: 'Still Water',
    description: '0.5 L sparkling or still mineral water.',
    price: 2.5,
    category: 'drink',
  },
  {
    name: 'Fresh Orange Juice',
    description: 'Hand-pressed seasonal oranges, no sugar added.',
    price: 4.5,
    category: 'drink',
  },
  {
    name: 'Espresso',
    description: 'Single-origin Arabica, double shot.',
    price: 2.8,
    category: 'drink',
  },
  {
    name: 'House Red Wine',
    description: 'Glass of Chianti Classico, dry, medium-bodied.',
    price: 6.0,
    category: 'drink',
  },
];

@Injectable()
export class DishSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(DishSeeder.name);

  constructor(
    @InjectModel(Dish.name) private readonly dishModel: Model<Dish>
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const existing = await this.dishModel.estimatedDocumentCount();
    if (existing > 0) {
      this.logger.log(
        `Dishes collection already has ${existing} docs, skipping seed.`
      );
      return;
    }

    const docs = SEED_DISHES.map((seed, index) => ({
      ...seed,
      imageUrl: `https://picsum.photos/seed/dish-${index + 1}/640/480`,
    }));

    await this.dishModel.insertMany(docs);
    this.logger.log(`Seeded ${docs.length} dishes.`);
  }
}
