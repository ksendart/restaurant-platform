import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AdminDishDto,
  CreateDishRequest,
  DISH_CATEGORIES,
  PREP_TIME_MAX,
  PREP_TIME_MIN,
  PREP_TIME_STEP,
  UpdateDishRequest,
} from '@restaurant-platform/shared-types';
import { AdminMenuStore } from '@restaurant-platform/state';
import { IngredientsInput } from './ingredients-input';

function prepTimeRangeValidator(
  group: AbstractControl
): ValidationErrors | null {
  const min = group.get('prepTimeMin')?.value as number | null;
  const max = group.get('prepTimeMax')?.value as number | null;
  const hasRange = group.get('hasRange')?.value as boolean;
  if (!hasRange || min === null || max === null) {
    return null;
  }
  return max >= min ? null : { prepTimeRange: true };
}

@Component({
  selector: 'rp-admin-menu-form-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    IngredientsInput,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSliderModule,
    MatTooltipModule,
  ],
  templateUrl: './admin-menu-form-page.html',
  styleUrl: './admin-menu-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminMenuFormPage implements OnInit {
  readonly id = input<string | undefined>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly store = inject(AdminMenuStore);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly categories = DISH_CATEGORIES;
  protected readonly prepMin = PREP_TIME_MIN;
  protected readonly prepMax = PREP_TIME_MAX;
  protected readonly prepStep = PREP_TIME_STEP;

  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);
  private submittedSuccessfully = false;

  protected readonly isEdit = computed(() => !!this.id());
  protected readonly heading = computed(() =>
    this.isEdit() ? 'Edit dish' : 'New dish'
  );

  protected readonly form = this.fb.group(
    {
      name: ['', [Validators.required, Validators.maxLength(120)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      category: this.fb.control<(typeof DISH_CATEGORIES)[number]>('main', [
        Validators.required,
      ]),
      price: this.fb.control<number>(0, [
        Validators.required,
        Validators.min(0),
      ]),
      imageUrl: ['', [Validators.required, Validators.maxLength(500)]],
      isAvailable: [true],
      ingredients: this.fb.control<string[]>([]),
      hasRange: [false],
      prepTimeMin: this.fb.control<number>(15, [
        Validators.required,
        Validators.min(PREP_TIME_MIN),
        Validators.max(PREP_TIME_MAX),
      ]),
      prepTimeMax: this.fb.control<number | null>(null),
    },
    { validators: prepTimeRangeValidator }
  );

  protected readonly hasRangeControl = this.form.controls.hasRange;
  protected readonly prepTimeMinControl = this.form.controls.prepTimeMin;
  protected readonly prepTimeMaxControl = this.form.controls.prepTimeMax;

  protected readonly imageUrlValue = toSignal(
    this.form.controls.imageUrl.valueChanges,
    { initialValue: '' }
  );
  protected readonly previewBroken = signal(false);
  protected readonly previewUrl = computed(() => {
    if (this.previewBroken()) return null;
    const raw = this.imageUrlValue().trim();
    return /^https?:\/\/\S+/i.test(raw) ? raw : null;
  });

  private readonly hasRangeValue = toSignal(this.hasRangeControl.valueChanges, {
    initialValue: this.hasRangeControl.value,
  });
  private readonly prepMinValue = toSignal(
    this.prepTimeMinControl.valueChanges,
    { initialValue: this.prepTimeMinControl.value }
  );
  private readonly prepMaxValue = toSignal(
    this.prepTimeMaxControl.valueChanges,
    { initialValue: this.prepTimeMaxControl.value }
  );
  protected readonly prepTimeSummary = computed(() => {
    const min = this.prepMinValue();
    const max = this.prepMaxValue();
    if (this.hasRangeValue() && max !== null && max !== min) {
      return `Prep time: ${min}–${max} minutes`;
    }
    return `Prep time: ${min} minutes`;
  });

  constructor() {
    this.hasRangeControl.valueChanges.subscribe((hasRange) => {
      if (hasRange) {
        if (this.prepTimeMaxControl.value === null) {
          this.prepTimeMaxControl.setValue(
            Math.min(
              this.prepTimeMinControl.value + PREP_TIME_STEP,
              PREP_TIME_MAX
            )
          );
        }
      } else {
        this.prepTimeMaxControl.setValue(null);
      }
      this.form.updateValueAndValidity({ emitEvent: false });
    });

    this.prepTimeMinControl.valueChanges.subscribe((min) => {
      const max = this.prepTimeMaxControl.value;
      if (this.hasRangeControl.value && max !== null && max < min) {
        this.prepTimeMaxControl.setValue(min);
      }
    });

    this.form.controls.imageUrl.valueChanges.subscribe(() => {
      this.previewBroken.set(false);
    });
  }

  protected useRandomPicsum(): void {
    const seed = Math.random().toString(36).slice(2, 10);
    this.form.controls.imageUrl.setValue(
      `https://picsum.photos/seed/${seed}/640/480`
    );
  }

  protected onPreviewError(): void {
    this.previewBroken.set(true);
  }

  ngOnInit(): void {
    const id = this.id();
    if (!id) {
      return;
    }
    const dish = this.store.findById(id);
    if (dish) {
      this.applyDish(dish);
    } else {
      // dish list may not be loaded yet on direct URL hit; trigger load and retry
      this.store.loadAll();
      queueMicrotask(() => {
        const loaded = this.store.findById(id);
        if (loaded) {
          this.applyDish(loaded);
        }
      });
    }
  }

  private applyDish(dish: AdminDishDto): void {
    this.form.patchValue({
      name: dish.name,
      description: dish.description,
      category: dish.category,
      price: dish.price,
      imageUrl: dish.imageUrl,
      isAvailable: dish.isAvailable,
      ingredients: dish.ingredients,
      hasRange: dish.prepTimeMax !== null,
      prepTimeMin: dish.prepTimeMin,
      prepTimeMax: dish.prepTimeMax,
    });
    this.form.markAsPristine();
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const raw = this.form.getRawValue();
    const payload: CreateDishRequest = {
      name: raw.name.trim(),
      description: raw.description.trim(),
      category: raw.category,
      price: raw.price,
      imageUrl: raw.imageUrl.trim(),
      isAvailable: raw.isAvailable,
      ingredients: raw.ingredients,
      prepTimeMin: raw.prepTimeMin,
      prepTimeMax: raw.hasRange ? raw.prepTimeMax : null,
    };

    this.submitting.set(true);
    this.serverError.set(null);

    const id = this.id();
    const request$ = id
      ? this.store.update(id, payload as UpdateDishRequest)
      : this.store.create(payload);

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.submittedSuccessfully = true;
        this.snackBar.open(id ? 'Dish updated' : 'Dish created', 'Dismiss', {
          duration: 3000,
        });
        void this.router.navigateByUrl('/admin/menu');
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.serverError.set(extractError(err));
      },
    });
  }

  protected cancel(): void {
    void this.router.navigateByUrl('/admin/menu');
  }

  canDeactivate(): boolean {
    if (this.submittedSuccessfully || this.form.pristine) {
      return true;
    }
    return window.confirm(
      'You have unsaved changes. Leave this page and discard them?'
    );
  }
}

function extractError(err: unknown): string {
  if (
    err &&
    typeof err === 'object' &&
    'error' in err &&
    err.error &&
    typeof err.error === 'object' &&
    'message' in err.error
  ) {
    const msg = (err.error as { message: unknown }).message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg) && msg.length > 0) return String(msg[0]);
  }
  return 'Something went wrong. Please try again.';
}
