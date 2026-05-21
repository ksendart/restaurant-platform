import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MenuService } from '@restaurant-platform/data-access-menu';
import {
  DISH_CATEGORIES,
  DishCategory,
  DishDto,
} from '@restaurant-platform/shared-types';
import { Skeleton } from '@restaurant-platform/ui';
import { DishCard } from '../dish-card/dish-card';

type CategoryFilter = DishCategory | 'all';
type CategorySection = { category: DishCategory; dishes: DishDto[] };

const CATEGORY_ORDER: readonly DishCategory[] = DISH_CATEGORIES;

const CATEGORY_LABELS: Record<DishCategory, string> = {
  starter: 'Starters',
  main: 'Mains',
  dessert: 'Desserts',
  drink: 'Drinks',
};

@Component({
  selector: 'rp-menu-page',
  imports: [DishCard, Skeleton],
  templateUrl: './menu-page.html',
  styleUrl: './menu-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPage {
  private readonly menuService = inject(MenuService);

  protected readonly dishes = this.menuService.menu.value;
  protected readonly isLoading = this.menuService.menu.isLoading;
  protected readonly error = this.menuService.menu.error;

  protected readonly filter = signal<CategoryFilter>('all');
  protected readonly filters: readonly CategoryFilter[] = [
    'all',
    ...DISH_CATEGORIES,
  ];

  protected readonly sections = computed<CategorySection[]>(() => {
    const all = this.dishes();
    const f = this.filter();
    const visible = f === 'all' ? all : all.filter((d) => d.category === f);

    return CATEGORY_ORDER.map((category) => ({
      category,
      dishes: visible.filter((d) => d.category === category),
    })).filter((section) => section.dishes.length > 0);
  });

  protected labelFor(filter: CategoryFilter): string {
    return filter === 'all' ? 'All' : CATEGORY_LABELS[filter];
  }

  protected setFilter(filter: CategoryFilter): void {
    this.filter.set(filter);
  }
}
