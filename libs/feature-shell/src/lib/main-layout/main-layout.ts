import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import {
  AuthStore,
  CartStore,
  UserOrdersStore,
} from '@restaurant-platform/state';
import { OrderDto, OrderStatus } from '@restaurant-platform/shared-types';

const ACTIVE_STATUSES: ReadonlySet<OrderStatus> = new Set([
  'pending',
  'preparing',
  'ready',
]);
const CART_PREVIEW_LIMIT = 5;
const ORDERS_PREVIEW_LIMIT = 3;

@Component({
  selector: 'rp-main-layout',
  imports: [
    CurrencyPipe,
    RouterLink,
    RouterOutlet,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayout {
  private readonly router = inject(Router);
  private readonly userOrders = inject(UserOrdersStore);

  protected readonly cart = inject(CartStore);
  protected readonly auth = inject(AuthStore);
  protected readonly currentYear = new Date().getFullYear();

  protected readonly cartPreviewItems = computed(() =>
    this.cart.items().slice(0, CART_PREVIEW_LIMIT)
  );
  protected readonly cartExtraCount = computed(() =>
    Math.max(0, this.cart.items().length - CART_PREVIEW_LIMIT)
  );

  protected readonly activeOrders = computed<OrderDto[]>(() =>
    this.userOrders
      .ordersEntities()
      .filter((order) => ACTIVE_STATUSES.has(order.status))
      .slice(0, ORDERS_PREVIEW_LIMIT)
  );

  protected signOut(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/menu');
  }

  protected shortId(id: string): string {
    return id.slice(-6).toUpperCase();
  }
}
