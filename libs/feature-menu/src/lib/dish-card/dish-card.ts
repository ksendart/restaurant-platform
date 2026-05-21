import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DishDto } from '@restaurant-platform/shared-types';
import { CartStore } from '@restaurant-platform/state';
import { Card, Price, Spinner } from '@restaurant-platform/ui';

@Component({
  selector: 'rp-dish-card',
  imports: [Card, Price, Spinner, MatButtonModule, MatIconModule],
  templateUrl: './dish-card.html',
  styleUrl: './dish-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-sold-out]': '!dish().isAvailable',
  },
})
export class DishCard {
  readonly dish = input.required<DishDto>();

  protected readonly cart = inject(CartStore);
  protected readonly imageLoaded = signal(false);
  protected readonly imageFailed = signal(false);

  protected readonly cartCount = computed(
    () =>
      this.cart.items().find((item) => item.dishId === this.dish().id)?.count ??
      0
  );

  protected onImageLoad(): void {
    this.imageLoaded.set(true);
  }

  protected onImageError(): void {
    this.imageFailed.set(true);
  }
}
