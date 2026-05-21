import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CartStore } from '@restaurant-platform/state';

@Component({
  selector: 'rp-checkout-page',
  imports: [],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutPage {
  protected readonly cart = inject(CartStore);
}
