import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { filter, map } from 'rxjs';
import { AdminSseClient } from '@restaurant-platform/data-access-sse';
import { AdminOrdersStore, AuthStore } from '@restaurant-platform/state';
import { AdminSoundService } from '../services/admin-sound.service';

const SOUND_PREF_KEY = 'rp-admin-sound-enabled';

@Component({
  selector: 'rp-admin-layout',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatButtonModule,
    MatIconModule,
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
  private readonly sseClient = inject(AdminSseClient);
  private readonly sound = inject(AdminSoundService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

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
  protected readonly soundEnabled = signal(this.readSoundPref());

  constructor() {
    effect(() => {
      const handset = this.isHandset();
      untracked(() => this.sidenavOpened.set(!handset));
    });

    this.sseClient.messages$
      .pipe(
        filter((event) => event.type === 'created'),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        if (this.soundEnabled()) {
          this.sound.playNewOrder();
        }
      });
  }

  protected toggleSound(): void {
    const next = !this.soundEnabled();
    this.soundEnabled.set(next);
    this.writeSoundPref(next);
    if (next) {
      this.sound.playNewOrder();
    }
  }

  private readSoundPref(): boolean {
    if (!this.isBrowser) {
      return false;
    }
    try {
      return localStorage.getItem(SOUND_PREF_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private writeSoundPref(value: boolean): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.setItem(SOUND_PREF_KEY, String(value));
    } catch {
      // ignore quota / disabled storage
    }
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
