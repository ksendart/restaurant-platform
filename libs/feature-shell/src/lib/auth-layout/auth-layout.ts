import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'rp-auth-layout',
  imports: [RouterLink, RouterOutlet, MatIconModule],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayout {
  protected readonly heroUrl = signal(
    `https://picsum.photos/seed/${Math.floor(Math.random() * 100000)}/1200/1600`
  );
}
