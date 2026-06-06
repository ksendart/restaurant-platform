import {
  ApplicationConfig,
  PLATFORM_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  provideRouter,
  TitleStrategy,
  withComponentInputBinding,
} from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  provideClientHydration,
  withEventReplay,
  withIncrementalHydration,
} from '@angular/platform-browser';
import { API_BASE_URL } from '@restaurant-platform/data-access-config';
import { AuthStore } from '@restaurant-platform/state';
import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';
import { authInterceptor } from './shared/interceptors/auth.interceptor';
import { errorInterceptor } from './shared/interceptors/error.interceptor';
import { RpTitleStrategy } from './shared/title-strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withIncrementalHydration(), withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAnimationsAsync(),
    provideRouter(appRoutes, withComponentInputBinding()),
    { provide: TitleStrategy, useClass: RpTitleStrategy },
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },
    provideAppInitializer(async () => {
      if (!isPlatformBrowser(inject(PLATFORM_ID))) {
        return;
      }
      const authStore = inject(AuthStore);
      await authStore.tryRestoreSession();
    }),
  ],
};
