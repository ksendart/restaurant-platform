import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { DishDto } from '@restaurant-platform/shared-types';
import { Card, Price, Spinner } from '@restaurant-platform/ui';

@Component({
  selector: 'rp-dish-card',
  imports: [Card, Price, Spinner],
  templateUrl: './dish-card.html',
  styleUrl: './dish-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-sold-out]': '!dish().isAvailable',
  },
})
export class DishCard {
  readonly dish = input.required<DishDto>();

  protected readonly imageLoaded = signal(false);
  protected readonly imageFailed = signal(false);

  protected onImageLoad(): void {
    this.imageLoaded.set(true);
  }

  protected onImageError(): void {
    this.imageFailed.set(true);
  }
}
