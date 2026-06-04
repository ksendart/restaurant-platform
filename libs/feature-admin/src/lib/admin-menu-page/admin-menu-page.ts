import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AdminDishDto,
  DISH_CATEGORIES,
  DishCategory,
} from '@restaurant-platform/shared-types';
import { AdminMenuStore } from '@restaurant-platform/state';

type ArchiveFilter = 'all' | 'active' | 'archived';
type CategoryFilter = DishCategory | 'all';

@Component({
  selector: 'rp-admin-menu-page',
  imports: [
    CurrencyPipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './admin-menu-page.html',
  styleUrl: './admin-menu-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminMenuPage {
  protected readonly store = inject(AdminMenuStore);
  protected readonly categories = DISH_CATEGORIES;

  protected readonly archiveFilter = signal<ArchiveFilter>('active');
  protected readonly categoryFilter = signal<CategoryFilter>('all');
  protected readonly searchTerm = signal('');
  protected readonly expandedId = signal<string | null>(null);

  protected readonly displayedColumns = [
    'expand',
    'name',
    'category',
    'price',
    'prepTime',
    'status',
    'actions',
  ] as const;
  protected readonly detailColumns = ['detail'] as const;

  protected readonly filteredDishes = computed<AdminDishDto[]>(() => {
    const all = this.store.dishes();
    const archive = this.archiveFilter();
    const category = this.categoryFilter();
    const term = this.searchTerm().trim().toLowerCase();

    return all.filter((dish) => {
      if (archive === 'active' && dish.isArchived) return false;
      if (archive === 'archived' && !dish.isArchived) return false;
      if (category !== 'all' && dish.category !== category) return false;
      if (term && !dish.name.toLowerCase().includes(term)) return false;
      return true;
    });
  });

  protected setArchiveFilter(value: ArchiveFilter): void {
    this.archiveFilter.set(value);
  }

  protected setCategoryFilter(value: CategoryFilter): void {
    this.categoryFilter.set(value);
  }

  protected onSearch(value: string): void {
    this.searchTerm.set(value);
  }

  protected toggleArchive(dish: AdminDishDto): void {
    this.store.setArchived(dish.id, !dish.isArchived);
  }

  protected retry(): void {
    this.store.loadAll();
  }

  protected formatPrepTime(dish: AdminDishDto): string {
    return dish.prepTimeMax === null || dish.prepTimeMax === dish.prepTimeMin
      ? `${dish.prepTimeMin} min`
      : `${dish.prepTimeMin}–${dish.prepTimeMax} min`;
  }

  protected toggleExpand(dish: AdminDishDto): void {
    this.expandedId.update((current) => (current === dish.id ? null : dish.id));
  }

  protected isExpanded(dish: AdminDishDto): boolean {
    return this.expandedId() === dish.id;
  }
}
