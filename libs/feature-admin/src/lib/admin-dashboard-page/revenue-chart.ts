import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { RevenueDayRow } from '@restaurant-platform/shared-types';
import { readCssVar } from './theme-colors';

@Component({
  selector: 'rp-revenue-chart',
  imports: [BaseChartDirective],
  template: `
    <div class="rp-revenue-chart">
      <canvas
        baseChart
        type="bar"
        [data]="chartData()"
        [options]="chartOptions"
      ></canvas>
    </div>
  `,
  styles: `
    .rp-revenue-chart {
      position: relative;
      height: 300px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RevenueChart {
  readonly days = input.required<RevenueDayRow[]>();

  protected readonly chartData = computed<ChartData<'bar'>>(() => {
    const rows = this.days();
    return {
      labels: rows.map((r) => formatLabel(r.date)),
      datasets: [
        {
          label: 'Revenue',
          data: rows.map((r) => r.revenue),
          backgroundColor: readCssVar('--mat-sys-primary', '#b91c5c'),
          borderRadius: 4,
        },
      ],
    };
  });

  protected readonly chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  };
}

function formatLabel(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return `${day}.${month}`;
}
