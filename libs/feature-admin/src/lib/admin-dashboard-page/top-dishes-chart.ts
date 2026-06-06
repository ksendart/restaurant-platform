import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { TopDishRow } from '@restaurant-platform/shared-types';
import { readCssVar } from './theme-colors';

export type TopDishesMode = 'count' | 'revenue';

@Component({
  selector: 'rp-top-dishes-chart',
  imports: [BaseChartDirective],
  template: `
    <div class="rp-top-dishes-chart">
      <canvas
        baseChart
        type="bar"
        [data]="chartData()"
        [options]="chartOptions"
      ></canvas>
    </div>
  `,
  styles: `
    .rp-top-dishes-chart {
      position: relative;
      height: 360px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopDishesChart {
  readonly dishes = input.required<TopDishRow[]>();
  readonly mode = input.required<TopDishesMode>();

  protected readonly chartData = computed<ChartData<'bar'>>(() => {
    const m = this.mode();
    const sorted = [...this.dishes()].sort((a, b) => b[m] - a[m]);
    return {
      labels: sorted.map((d) => d.name),
      datasets: [
        {
          label: m === 'count' ? 'Quantity' : 'Revenue',
          data: sorted.map((d) => d[m]),
          backgroundColor:
            m === 'count'
              ? readCssVar('--mat-sys-primary', '#b91c5c')
              : readCssVar('--mat-sys-tertiary', '#3f6e44'),
          borderRadius: 4,
        },
      ],
    };
  });

  protected readonly chartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, ticks: { precision: 0 } },
    },
  };
}
