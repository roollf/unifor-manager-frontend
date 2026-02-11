/**
 * Query params for GET /api/coordinator/matrices/{matrixId}/classes.
 * Backend expects periodOfDay as MORNING | AFTERNOON | EVENING.
 */
export interface ListClassesParams {
  periodOfDay?: 'MORNING' | 'AFTERNOON' | 'EVENING';
  authorizedCourseId?: number;
  maxStudentsMin?: number;
  maxStudentsMax?: number;
  includeDeleted?: boolean;
}

/** Map UI turn (M/T/N) to backend periodOfDay enum. */
export function toBackendPeriodOfDay(
  uiValue: string | null | undefined
): ListClassesParams['periodOfDay'] | undefined {
  if (uiValue == null || uiValue === '') return undefined;
  const map: Record<string, ListClassesParams['periodOfDay']> = {
    M: 'MORNING',
    T: 'AFTERNOON',
    N: 'EVENING',
  };
  return map[uiValue];
}
