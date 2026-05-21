import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
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
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { AuthStore, CartStore } from '@restaurant-platform/state';

const PHONE_PATTERN = /^\+?[0-9 ]{7,15}$/;
const PICKUP_OPEN_HOUR = 10;
const PICKUP_CLOSE_HOUR = 22;
const PICKUP_STEP_MIN = 30;
const PICKUP_LEAD_MIN = 30;

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

@Component({
  selector: 'rp-checkout-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
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
  private readonly router = inject(Router);

  protected readonly cart = this.cartStore;
  protected readonly pickupSlots = generatePickupSlots();
  protected readonly submitted = signal(false);

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

  canDeactivate(): boolean {
    if (this.submitted() || !this.isDirty()) {
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
    this.submitted.set(true);
    this.cartStore.clear();
    void this.router.navigateByUrl('/menu');
  }
}
