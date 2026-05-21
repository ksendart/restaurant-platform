import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { OrdersApi } from '@restaurant-platform/data-access-orders';
import { AuthStore, CartStore } from '@restaurant-platform/state';

const PHONE_PATTERN = /^\+?[0-9 ]{7,15}$/;
const PICKUP_OPEN_HOUR = 10;
const PICKUP_CLOSE_HOUR = 22;
const PICKUP_STEP_MIN = 30;
const PICKUP_LEAD_MIN = 30;
const REDIRECT_AFTER_SUCCESS_SEC = 5;

function generatePickupSlots(now: Date = new Date()): string[] {
  const start = new Date(now);
  start.setMinutes(start.getMinutes() + PICKUP_LEAD_MIN);
  const remainder = start.getMinutes() % PICKUP_STEP_MIN;
  if (remainder !== 0) {
    start.setMinutes(start.getMinutes() + (PICKUP_STEP_MIN - remainder));
  }
  start.setSeconds(0, 0);

  if (start.getHours() < PICKUP_OPEN_HOUR) {
    start.setHours(PICKUP_OPEN_HOUR, 0, 0, 0);
  }

  const slots: string[] = [];
  const cursor = new Date(start);
  while (cursor.getHours() < PICKUP_CLOSE_HOUR) {
    slots.push(
      `${String(cursor.getHours()).padStart(2, '0')}:${String(
        cursor.getMinutes()
      ).padStart(2, '0')}`
    );
    cursor.setMinutes(cursor.getMinutes() + PICKUP_STEP_MIN);
  }
  return slots;
}

type CheckoutStatus = 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'rp-checkout-page',
  imports: [
    NgTemplateOutlet,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatStepperModule,
  ],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly cartStore = inject(CartStore);
  private readonly authStore = inject(AuthStore);
  private readonly ordersApi = inject(OrdersApi);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly cart = this.cartStore;
  protected readonly pickupSlots = generatePickupSlots();

  protected readonly status = signal<CheckoutStatus>('idle');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly countdown = signal(REDIRECT_AFTER_SUCCESS_SEC);

  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  protected readonly contactsForm = this.fb.group({
    name: [this.authStore.user()?.name ?? '', [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    email: [
      this.authStore.user()?.email ?? '',
      [Validators.required, Validators.email],
    ],
  });

  protected readonly pickupForm = this.fb.group({
    slot: ['', [Validators.required]],
  });

  protected readonly paymentForm = this.fb.group({});

  protected readonly isDirty = computed(
    () =>
      this.contactsForm.dirty || this.pickupForm.dirty || this.paymentForm.dirty
  );

  constructor() {
    this.destroyRef.onDestroy(() => this.stopCountdown());
  }

  canDeactivate(): boolean {
    if (this.status() === 'success' || !this.isDirty()) {
      return true;
    }
    return window.confirm(
      'You have unsaved checkout details. Leave this page?'
    );
  }

  protected onSubmit(): void {
    if (this.contactsForm.invalid || this.pickupForm.invalid) {
      this.contactsForm.markAllAsTouched();
      this.pickupForm.markAllAsTouched();
      return;
    }
    this.placeOrder();
  }

  protected retry(): void {
    this.placeOrder();
  }

  protected goToMenuNow(): void {
    this.stopCountdown();
    void this.router.navigateByUrl('/menu');
  }

  private placeOrder(): void {
    this.status.set('submitting');
    this.errorMessage.set(null);

    const contact = this.contactsForm.getRawValue();
    const pickup = this.pickupForm.getRawValue();
    const items = this.cartStore.items().map((item) => ({
      dishId: item.dishId,
      name: item.name,
      price: item.price,
      count: item.count,
    }));

    this.ordersApi
      .create({ items, contact, pickupSlot: pickup.slot })
      .subscribe({
        next: () => {
          this.cartStore.clear();
          this.status.set('success');
          this.startCountdown();
        },
        error: (err: unknown) => {
          this.status.set('error');
          this.errorMessage.set(extractErrorMessage(err));
        },
      });
  }

  private startCountdown(): void {
    this.countdown.set(REDIRECT_AFTER_SUCCESS_SEC);
    this.countdownTimer = setInterval(() => {
      const next = this.countdown() - 1;
      if (next <= 0) {
        this.stopCountdown();
        void this.router.navigateByUrl('/menu');
        return;
      }
      this.countdown.set(next);
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.countdownTimer !== null) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }
}

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'error' in err) {
    const body = (err as { error?: { message?: string | string[] } }).error;
    if (body?.message) {
      return Array.isArray(body.message)
        ? body.message.join(', ')
        : body.message;
    }
  }
  return 'Something went wrong. Please try again.';
}
