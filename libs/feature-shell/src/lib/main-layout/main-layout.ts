import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore, CartStore } from '@restaurant-platform/state';

@Component({
  selector: 'rp-main-layout',
  imports: [
    RouterLink,
    RouterOutlet,
    MatBadgeModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayout {
  protected readonly cart = inject(CartStore);
  protected readonly auth = inject(AuthStore);
  protected readonly currentYear = new Date().getFullYear();
}
