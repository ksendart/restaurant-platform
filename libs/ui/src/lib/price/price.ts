import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'rp-price',
  imports: [CurrencyPipe],
  template: `{{ value() | currency : currency() : 'symbol' : '1.2-2' }}`,
  styleUrl: './price.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Price {
  readonly value = input.required<number>();
  readonly currency = input<string>('EUR');
}
