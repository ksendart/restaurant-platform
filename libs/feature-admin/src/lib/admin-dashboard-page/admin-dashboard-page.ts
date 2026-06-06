import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ANALYTICS_MAX_RANGE_DAYS,
  RevenueResponse,
  RevenueTotals,
} from '@restaurant-platform/shared-types';
import {
  AnalyticsRangeInput,
  AnalyticsService,
} from '@restaurant-platform/data-access-analytics';
import {
  daysAgoUtc,
  diffInDays,
  endOfUtcDay,
  startOfUtcDay,
} from './range-utils';

interface DateRangeForm {
  start: FormControl<Date | null>;
  end: FormControl<Date | null>;
}

const ZERO_TOTALS: RevenueTotals = {
  revenue: 0,
  ordersCount: 0,
  avgCheck: 0,
  conversionRate: 0,
};

@Component({
  selector: 'rp-admin-dashboard-page',
  imports: [
    CurrencyPipe,
    DecimalPipe,
    PercentPipe,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  templateUrl: './admin-dashboard-page.html',
  styleUrl: './admin-dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardPage {
  private readonly analytics = inject(AnalyticsService);

  protected readonly maxDate = startOfUtcDay(new Date());
  protected readonly maxRangeDays = ANALYTICS_MAX_RANGE_DAYS;

  protected readonly rangeForm = new FormGroup<DateRangeForm>({
    start: new FormControl<Date | null>(daysAgoUtc(6)),
    end: new FormControl<Date | null>(this.maxDate),
  });

  protected readonly rangeError = signal<string | null>(null);
  private readonly range = signal<AnalyticsRangeInput | null>(
    toRangeInput(daysAgoUtc(6), this.maxDate)
  );

  protected readonly revenueRes = this.analytics.revenue(this.range);

  protected readonly isLoading = this.revenueRes.isLoading;
  protected readonly hasError = computed(() => !!this.revenueRes.error());

  protected readonly totals: Signal<RevenueTotals> = computed(
    () => this.revenueRes.value()?.totals ?? ZERO_TOTALS
  );

  protected readonly revenueValue = computed(() => this.totals().revenue);
  protected readonly ordersCount = computed(() => this.totals().ordersCount);
  protected readonly avgCheck = computed(() => this.totals().avgCheck);
  protected readonly conversionRate = computed(
    () => this.totals().conversionRate
  );

  protected readonly response: Signal<RevenueResponse | undefined> =
    this.revenueRes.value;

  constructor() {
    this.rangeForm.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(({ start, end }) => {
        if (!start || !end) {
          return;
        }
        const from = startOfUtcDay(start);
        const to = endOfUtcDay(end);
        if (diffInDays(from, to) > ANALYTICS_MAX_RANGE_DAYS) {
          this.rangeError.set(
            `Range must not exceed ${ANALYTICS_MAX_RANGE_DAYS} days`
          );
          return;
        }
        this.rangeError.set(null);
        this.range.set({ from: from.toISOString(), to: to.toISOString() });
      });
  }
}

function toRangeInput(start: Date, end: Date): AnalyticsRangeInput {
  return {
    from: startOfUtcDay(start).toISOString(),
    to: endOfUtcDay(end).toISOString(),
  };
}
