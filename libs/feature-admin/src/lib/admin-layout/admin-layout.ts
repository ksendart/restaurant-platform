import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { map } from 'rxjs';
import { AdminOrdersStore, AuthStore } from '@restaurant-platform/state';

@Component({
  selector: 'rp-admin-layout',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
  ],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayout {
  private readonly router = inject(Router);
  private readonly breakpoints = inject(BreakpointObserver);
  private readonly sidenav = viewChild.required(MatSidenav);

  protected readonly auth = inject(AuthStore);
  protected readonly adminOrders = inject(AdminOrdersStore);

  protected readonly isHandset = toSignal(
    this.breakpoints
      .observe([Breakpoints.Handset])
      .pipe(map((state) => state.matches)),
    { initialValue: false }
  );

  protected readonly sidenavMode = computed(() =>
    this.isHandset() ? 'over' : 'side'
  );
  protected readonly sidenavOpened = signal(true);

  constructor() {
    effect(() => {
      const handset = this.isHandset();
      untracked(() => this.sidenavOpened.set(!handset));
    });
  }

  protected toggleSidenav(): void {
    void this.sidenav().toggle();
  }

  protected closeSidenavOnMobile(): void {
    if (this.isHandset()) {
      this.sidenavOpened.set(false);
    }
  }

  protected signOut(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/menu');
  }
}
