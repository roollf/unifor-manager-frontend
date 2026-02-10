import { inject } from '@angular/core';
import type { HttpInterceptorFn } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import type { ApiErrorResponseDto } from '../models';

/**
 * Maps 409 conflict codes to user-friendly messages per PRD §3.
 * Other 4xx/5xx use body.message or a generic fallback.
 */
const CONFLICT_MESSAGES: Record<string, string> = {
  CONFLICT_NO_SEATS: 'No seats available.',
  CONFLICT_SCHEDULE: 'Schedule conflict.',
  CONFLICT_SCHEDULE_CONFLICT: 'Schedule conflict.',
  CONFLICT_DUPLICATE_SUBJECT: 'Already enrolled in this subject.',
  CONFLICT_ALREADY_ENROLLED: 'Already enrolled.',
  CONFLICT_UNAUTHORIZED_COURSE: 'Not authorized for this course.',
  CONFLICT_MATRIX_INACTIVE: 'Enrollment only allowed in the active matrix.',
  CONFLICT_HAS_ENROLLMENTS: 'Cannot delete: class has enrollments.',
  CONFLICT_INVALIDATE_ENROLLMENTS:
    'Cannot change authorized courses: it would invalidate existing enrollments.',
  CONFLICT_DUPLICATE_SUBJECT_SLOT: 'This subject and time slot already exist in the matrix.',
};

function getMessage(status: number, body: ApiErrorResponseDto | null): string {
  if (body?.code && status === 409 && CONFLICT_MESSAGES[body.code]) {
    return CONFLICT_MESSAGES[body.code];
  }
  if (body?.message && typeof body.message === 'string') {
    return body.message;
  }
  switch (status) {
    case 400:
      return 'Invalid request. Please check the form.';
    case 404:
      return 'Resource not found.';
    case 500:
      return 'An unexpected error occurred. Please try again.';
    default:
      return 'An error occurred.';
  }
}

/**
 * Parses 4xx/5xx responses (except 401/403), maps to user message, shows PrimeNG Toast, rethrows.
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

      const detail = getMessage(status, body);
      messageService.add({
        severity: 'error',
        summary: 'Error',
        detail,
      });

      return throwError(() => err);
    })
  );
};
