/**
 * Query params for GET /api/student/classes/available.
 * Per FRONTEND_CONTRACT §4.4 List available classes – Query params.
 */
export interface ListAvailableClassesParams {
  matrixId?: number;
  subjectId?: number;
}
