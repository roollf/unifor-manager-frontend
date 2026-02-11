/**
 * API lib — REST services, DTOs, interceptors.
 * Phase 3: CoordinatorService, StudentService, ErrorInterceptor.
 */

export * from './core/api-base-url.token';
export * from './models';
export * from './coordinator/coordinator.service';
export { toBackendPeriodOfDay } from './coordinator/list-classes-params';
export type { ListClassesParams } from './coordinator/list-classes-params';
export * from './student/student.service';
export * from './student/list-available-classes-params';
export * from './interceptors/error.interceptor';
export * from './errors/error-messages';
