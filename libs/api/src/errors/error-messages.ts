import type { ApiErrorResponseDto } from '../models';

/**
 * Maps API 409 conflict codes to user-facing messages per PRD §3.
 * Single source of truth for i18n: replace values with translation keys (e.g. 'ERROR.CONFLICT_NO_SEATS') when adding i18n.
 */
export const CONFLICT_MESSAGES: Record<string, string> = {
  CONFLICT_NO_SEATS: 'Não há vagas disponíveis.',
  CONFLICT_SCHEDULE: 'Conflito de horário.',
  CONFLICT_SCHEDULE_CONFLICT: 'Conflito de horário.',
  CONFLICT_DUPLICATE_SUBJECT: 'Você já está matriculado nesta disciplina.',
  CONFLICT_ALREADY_ENROLLED: 'Você já está matriculado.',
  CONFLICT_UNAUTHORIZED_COURSE: 'Não autorizado para este curso.',
  CONFLICT_MATRIX_INACTIVE: 'Matrícula permitida apenas na matriz ativa.',
  CONFLICT_HAS_ENROLLMENTS: 'Não é possível excluir: a turma possui matrículas.',
  CONFLICT_INVALIDATE_ENROLLMENTS:
    'Não é possível alterar os cursos autorizados: isso invalidaria matrículas existentes.',
  CONFLICT_DUPLICATE_SUBJECT_SLOT: 'Esta disciplina e horário já existem na matriz.',
};

/** Default messages for status codes when body.message is not present. PRD §3. */
const STATUS_MESSAGES: Record<number, string> = {
  400: 'Erro de validação. Verifique o formulário e tente novamente.',
  404: 'Recurso não encontrado.',
  500: 'Ocorreu um erro inesperado. Tente novamente.',
};

const DEFAULT_MESSAGE = 'Ocorreu um erro.';

/**
 * Returns a user-facing message for an HTTP error (4xx/5xx).
 * 409: uses CONFLICT_MESSAGES by body.code; otherwise body.message or status fallback.
 * Per PRD §3; form-level validation highlighting remains in components.
 */
export function getMessageForHttpError(
  status: number,
  body: ApiErrorResponseDto | null
): string {
  if (body?.code && status === 409 && CONFLICT_MESSAGES[body.code]) {
    return CONFLICT_MESSAGES[body.code];
  }
  if (body?.message && typeof body.message === 'string') {
    return body.message;
  }
  return STATUS_MESSAGES[status] ?? DEFAULT_MESSAGE;
}
