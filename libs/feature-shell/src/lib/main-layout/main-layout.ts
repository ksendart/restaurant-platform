import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthStore, CartStore } from '@restaurant-platform/state';

@Component({
  selector: 'rp-main-layout',
  imports: [
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

  protected readonly cart = inject(CartStore);
  protected readonly auth = inject(AuthStore);
  protected readonly currentYear = new Date().getFullYear();

  protected signOut(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/menu');
  }
}
