import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'rp-card',
  template: `<ng-content />`,
  styleUrl: './card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Card {}
