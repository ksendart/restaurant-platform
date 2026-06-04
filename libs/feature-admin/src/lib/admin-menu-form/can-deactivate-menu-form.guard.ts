import { CanDeactivateFn } from '@angular/router';

interface CanLeaveForm {
  canDeactivate(): boolean;
}

export const canDeactivateMenuFormGuard: CanDeactivateFn<CanLeaveForm> = (
  component
) => component.canDeactivate();
