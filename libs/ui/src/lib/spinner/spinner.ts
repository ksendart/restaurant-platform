import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'rp-spinner',
  template: ``,
  styleUrl: './spinner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'progressbar',
    'aria-label': 'Loading',
  },
})
export class Spinner {}
