import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

@Component({
  selector: 'rp-ingredients-input',
  imports: [MatChipsModule, MatFormFieldModule, MatIconModule],
  templateUrl: './ingredients-input.html',
  styleUrl: './ingredients-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IngredientsInput),
      multi: true,
    },
  ],
})
export class IngredientsInput implements ControlValueAccessor {
  protected readonly separatorKeysCodes = [ENTER, COMMA];
  protected readonly items = signal<string[]>([]);
  protected readonly disabled = signal(false);

  private onChange: (value: string[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string[] | null): void {
    this.items.set(Array.isArray(value) ? [...value] : []);
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected add(event: MatChipInputEvent): void {
    const raw = event.value ?? '';
    const value = raw.trim();
    event.chipInput?.clear();
    if (!value) {
      return;
    }
    const next = [...this.items()];
    if (!next.some((item) => item.toLowerCase() === value.toLowerCase())) {
      next.push(value);
      this.items.set(next);
      this.onChange(next);
    }
    this.onTouched();
  }

  protected remove(item: string): void {
    const next = this.items().filter((existing) => existing !== item);
    this.items.set(next);
    this.onChange(next);
    this.onTouched();
  }
}
