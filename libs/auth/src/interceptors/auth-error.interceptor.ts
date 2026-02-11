import { inject } from '@angular/core';
import {
  type HttpInterceptorFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, EMPTY, throwError } from 'rxjs';
import Keycloak from 'keycloak-js';

/**
 * Handles 401 (redirect to Keycloak login) and 403 (redirect to /forbidden).
 * Per PRD §3 and Phase 6: 401 → redirect to login (Keycloak); 403 → show “access denied” (/forbidden page).
 */
export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const keycloak = inject(Keycloak);

  return next(req).pipe(
    catchError((err: unknown) => {
      const httpErr = err as HttpErrorResponse;
      if (httpErr.status === 401) {
        const redirectUri = window.location.href;
        keycloak.login({ redirectUri }).catch((e) =>
          console.error('Keycloak login failed', e)
        );
        return EMPTY;
      }
      if (httpErr.status === 403) {
        router.navigate(['/forbidden']);
        return EMPTY;
      }
      return throwError(() => err);
    })
  );
};
