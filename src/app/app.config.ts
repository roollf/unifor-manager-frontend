import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import {
  includeBearerTokenInterceptor,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  createInterceptorCondition,
  provideKeycloak,
} from 'keycloak-angular';
import type { IncludeBearerTokenCondition } from 'keycloak-angular';
import { authErrorInterceptor } from '@unifor-manager/auth';
import { API_BASE_URL, errorInterceptor } from '@unifor-manager/api';
import Aura from '@primeuix/themes/aura';

import { environment } from '../environments/environment';
import { routes } from './app.routes';

/** Builds a URL pattern so the bearer token is added for requests to the API base URL. */
function apiUrlCondition(): IncludeBearerTokenCondition {
  const base = environment.apiUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return createInterceptorCondition<IncludeBearerTokenCondition>({
    urlPattern: new RegExp(`^${base}(\\/.*)?$`, 'i'),
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: API_BASE_URL, useValue: environment.apiUrl },
    {
      provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
      useValue: [apiUrlCondition()],
    },
    MessageService,
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withInterceptors([
        includeBearerTokenInterceptor,
        authErrorInterceptor,
        errorInterceptor,
      ])
    ),
    provideRouter(routes),
    providePrimeNG({
      theme: {
        preset: Aura,
      },
    }),
    provideKeycloak({
      config: {
        url: environment.keycloak.url,
        realm: environment.keycloak.realm,
        clientId: environment.keycloak.clientId,
      },
      initOptions: {
        onLoad: 'check-sso',
      },
    }),
  ],
};
