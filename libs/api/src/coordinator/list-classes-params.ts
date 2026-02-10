/**
 * Query params for GET /api/coordinator/matrices/{matrixId}/classes.
 * Per FRONTEND_CONTRACT §4.4 List classes – Query params.
 */
export interface ListClassesParams {
  periodOfDay?: 'MORNING' | 'AFTERNOON' | 'EVENING';
  authorizedCourseId?: number;
  maxStudentsMin?: number;
  maxStudentsMax?: number;
  includeDeleted?: boolean;
}
