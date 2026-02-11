import { inject } from '@angular/core';
import type { HttpInterceptorFn } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import type { ApiErrorResponseDto } from '../models';
import { getMessageForHttpError } from '../errors/error-messages';

/**
 * Parses 4xx/5xx responses (except 401/403), maps to user message via shared error-messages, shows PrimeNG Toast, rethrows.
 * 401/403 are left to authErrorInterceptor. Per PRD Phase 3 and ARCHITECTURE §4.2.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError((err: unknown) => {
      const httpErr = err as HttpErrorResponse;
      const status = httpErr.status;

      if (status === 401 || status === 403) {
        return throwError(() => err);
      }

      const body =
        typeof httpErr.error === 'object' && httpErr.error !== null
          ? (httpErr.error as ApiErrorResponseDto)
          : null;

      const detail = getMessageForHttpError(status, body);
      messageService.add({
        severity: 'error',
        summary: 'Error',
        detail,
      });

      return throwError(() => err);
    })
  );
};
