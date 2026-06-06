import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DishCategory } from '@restaurant-platform/shared-types';
import { isSeedEnabled } from '../common/seed-enabled';
import { Dish } from './dish.schema';

type DishSeed = {
  name: string;
  description: string;
  price: number;
  category: DishCategory;
  ingredients: string[];
  prepTimeMin: number;
  prepTimeMax: number | null;
};

const SEED_DISHES: DishSeed[] = [
  {
    name: 'Bruschetta Pomodoro',
    description: 'Toasted bread, ripe tomatoes, basil, garlic, olive oil.',
    price: 7.5,
    category: 'starter',
    ingredients: ['ciabatta', 'tomato', 'basil', 'garlic', 'olive oil'],
    prepTimeMin: 10,
    prepTimeMax: 15,
  },
  {
    name: 'Caesar Salad',
    description:
      'Romaine, parmesan shavings, croutons, classic Caesar dressing.',
    price: 9.9,
    category: 'starter',
    ingredients: ['romaine', 'parmesan', 'croutons', 'caesar dressing'],
    prepTimeMin: 10,
    prepTimeMax: null,
  },
  {
    name: 'Burrata with Heirloom Tomatoes',
    description: 'Creamy burrata, heirloom tomatoes, aged balsamic, basil oil.',
    price: 12.5,
    category: 'starter',
    ingredients: ['burrata', 'heirloom tomatoes', 'balsamic', 'basil oil'],
    prepTimeMin: 10,
    prepTimeMax: null,
  },
  {
    name: 'Margherita Pizza',
    description:
      'San Marzano tomato, fior di latte, basil, extra-virgin olive oil.',
    price: 13.0,
    category: 'main',
    ingredients: ['pizza dough', 'tomato sauce', 'fior di latte', 'basil'],
    prepTimeMin: 15,
    prepTimeMax: 20,
  },
  {
    name: 'Spaghetti Carbonara',
    description: 'Guanciale, egg yolk, pecorino romano, cracked black pepper.',
    price: 14.5,
    category: 'main',
    ingredients: ['spaghetti', 'guanciale', 'egg yolk', 'pecorino', 'pepper'],
    prepTimeMin: 15,
    prepTimeMax: 25,
  },
  {
    name: 'Grilled Salmon',
    description: 'Atlantic salmon, lemon-dill butter, seasonal vegetables.',
    price: 21.0,
    category: 'main',
    ingredients: ['salmon', 'lemon', 'dill', 'butter', 'seasonal vegetables'],
    prepTimeMin: 20,
    prepTimeMax: 30,
  },
  {
    name: 'Ribeye Steak',
    description: '300g aged ribeye, rosemary butter, roasted potatoes.',
    price: 28.0,
    category: 'main',
    ingredients: ['ribeye', 'rosemary', 'butter', 'potatoes'],
    prepTimeMin: 25,
    prepTimeMax: 40,
  },
  {
    name: 'Mushroom Risotto',
    description: 'Arborio rice, porcini, parmesan, white wine, truffle oil.',
    price: 16.5,
    category: 'main',
    ingredients: [
      'arborio rice',
      'porcini',
      'parmesan',
      'white wine',
      'truffle oil',
    ],
    prepTimeMin: 25,
    prepTimeMax: 35,
  },
  {
    name: 'Tiramisu',
    description: 'Mascarpone, espresso-soaked savoiardi, cocoa dust.',
    price: 7.0,
    category: 'dessert',
    ingredients: ['mascarpone', 'savoiardi', 'espresso', 'cocoa'],
    prepTimeMin: 5,
    prepTimeMax: null,
  },
  {
    name: 'Panna Cotta',
    description: 'Vanilla cream, fresh berries, mint.',
    price: 6.5,
    category: 'dessert',
    ingredients: ['cream', 'vanilla', 'berries', 'mint'],
    prepTimeMin: 5,
    prepTimeMax: null,
  },
  {
    name: 'Chocolate Fondant',
    description: 'Warm dark chocolate cake, molten center, vanilla ice cream.',
    price: 8.0,
    category: 'dessert',
    ingredients: ['dark chocolate', 'butter', 'eggs', 'vanilla ice cream'],
    prepTimeMin: 10,
    prepTimeMax: 15,
  },
  {
    name: 'Still Water',
    description: '0.5 L sparkling or still mineral water.',
    price: 2.5,
    category: 'drink',
    ingredients: ['mineral water'],
    prepTimeMin: 5,
    prepTimeMax: null,
  },
  {
    name: 'Fresh Orange Juice',
    description: 'Hand-pressed seasonal oranges, no sugar added.',
    price: 4.5,
    category: 'drink',
    ingredients: ['oranges'],
    prepTimeMin: 5,
    prepTimeMax: null,
  },
  {
    name: 'Espresso',
    description: 'Single-origin Arabica, double shot.',
    price: 2.8,
    category: 'drink',
    ingredients: ['arabica coffee'],
    prepTimeMin: 5,
    prepTimeMax: null,
  },
  {
    name: 'House Red Wine',
    description: 'Glass of Chianti Classico, dry, medium-bodied.',
    price: 6.0,
    category: 'drink',
    ingredients: ['chianti classico'],
    prepTimeMin: 5,
    prepTimeMax: null,
  },
];

@Injectable()
export class DishSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(DishSeeder.name);

  constructor(
    @InjectModel(Dish.name) private readonly dishModel: Model<Dish>,
    private readonly configService: ConfigService
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!isSeedEnabled(this.configService)) {
      this.logger.log(
        'Seeding disabled (SEED_ENABLED=false), skipping dishes.'
      );
      return;
    }
    const existing = await this.dishModel.estimatedDocumentCount();
    if (existing > 0) {
      this.logger.log(
        `Dishes collection already has ${existing} docs, skipping seed.`
      );
      await this.backfillPrepTime();
      return;
    }

    const docs = SEED_DISHES.map((seed, index) => ({
      ...seed,
      imageUrl: `https://picsum.photos/seed/dish-${index + 1}/640/480`,
    }));

    await this.dishModel.insertMany(docs);
    this.logger.log(`Seeded ${docs.length} dishes.`);
  }

  private async backfillPrepTime(): Promise<void> {
    const result = await this.dishModel.updateMany(
      { prepTimeMin: { $exists: false } },
      { $set: { prepTimeMin: 15, prepTimeMax: null, ingredients: [] } }
    );
    if (result.modifiedCount > 0) {
      this.logger.log(
        `Backfilled prep time / ingredients on ${result.modifiedCount} dishes.`
      );
    }
  }
}
