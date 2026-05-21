import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormGroupDirective,
  NgForm,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthStore } from '@restaurant-platform/state';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  if (!password || !confirm) return null;
  return password === confirm ? null : { passwordsMismatch: true };
}

class ConfirmPasswordErrorMatcher implements ErrorStateMatcher {
  isErrorState(
    control: AbstractControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const controlInvalid = !!control && control.invalid && control.touched;
    const groupMismatch =
      !!form?.errors?.['passwordsMismatch'] && !!control?.touched;
    return controlInvalid || groupMismatch;
  }
}

@Component({
  selector: 'rp-register-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
  ],
  templateUrl: './register-page.html',
  styleUrl: './register-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly status = this.authStore.status;
  protected readonly isLoading = computed(() => this.status() === 'loading');
  protected readonly submitted = signal(false);
  protected readonly confirmPasswordMatcher = new ConfirmPasswordErrorMatcher();

  protected readonly form = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      name: [''],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(72),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch }
  );

  constructor() {
    effect(() => {
      if (this.submitted() && this.authStore.isAuthorized()) {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        void this.router.navigateByUrl(returnUrl ?? '/menu');
      }
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted.set(true);
    const { email, name, password } = this.form.getRawValue();
    this.authStore.register({
      email,
      password,
      ...(name ? { name } : {}),
    });
  }
}
