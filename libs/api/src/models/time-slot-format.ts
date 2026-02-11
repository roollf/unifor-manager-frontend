import type { TimeSlotDto } from './api-dtos';

const TURN_LABELS: Record<string, string> = {
  M: 'Manhã',
  T: 'Tarde',
  N: 'Noite',
};

const DAY_CODE_LABELS: Record<string, string> = {
  '24': 'seg/qua',
  '35': 'ter/qui',
  '246': 'seg/qua/sex',
};

const SLOT_LABELS: Record<string, string> = {
  AB: 'A/B',
  CD: 'C/D',
  EF: 'E/F',
};

/** Time range by turn + slotCode (Manhã/Tarde/Noite × A/B, C/D, E/F) */
const TIME_RANGES: Record<string, Record<string, string>> = {
  M: {
    AB: '7h30 às 9h10',
    CD: '9h30 às 11h10',
    EF: '11h20 às 13h',
  },
  T: {
    AB: '13h30 às 15h10',
    CD: '15h30 às 17h10',
    EF: '17h20 às 19h',
  },
  N: {
    AB: '19h às 20h40',
    CD: '21h às 22h40',
    EF: '—',
  },
};

function parseCode(code: string): { turn: string; dayCode: string; slotCode: string } | null {
  if (!code || code.length < 5) return null;
  const turn = code[0];
  const slotCode = code.slice(-2).toUpperCase();
  const dayCode = code.slice(1, -2);
  return { turn, dayCode, slotCode };
}

/**
 * Formats a time slot for display using the new API format.
 * Example: "Manhã, seg/qua, A/B (7h30 às 9h10)" or legacy "dayOfWeek startTime–endTime".
 */
export function formatTimeSlotLabel(slot: TimeSlotDto | null | undefined): string {
  if (!slot) return '—';

  const code = slot.code ?? (slot.turn && slot.dayCode && slot.slotCode
    ? `${slot.turn}${slot.dayCode}${slot.slotCode}`
    : null);

  if (code) {
    const parsed = parseCode(code);
    if (parsed) {
      const { turn, dayCode, slotCode } = parsed;
      const turnLabel = TURN_LABELS[turn] ?? turn;
      const dayLabel = DAY_CODE_LABELS[dayCode] ?? dayCode;
      const slotLabel = SLOT_LABELS[slotCode] ?? slotCode;
      const timeRange =
        TIME_RANGES[turn]?.[slotCode] ??
        (slot.startTime && slot.endTime ? `${slot.startTime}–${slot.endTime}` : '');
      if (timeRange && timeRange !== '—') {
        return `${turnLabel}, ${dayLabel}, ${slotLabel} (${timeRange})`;
      }
      return `${turnLabel}, ${dayLabel}, ${slotLabel}`;
    }
  }

  if (slot.dayOfWeek != null && slot.startTime != null && slot.endTime != null) {
    return `${slot.dayOfWeek} ${slot.startTime}–${slot.endTime}`;
  }
  if (slot.startTime != null && slot.endTime != null) {
    return `${slot.startTime}–${slot.endTime}`;
  }
  return '—';
}

/**
 * Short label for dropdowns: "Manhã, seg/qua, A/B" or code.
 */
export function formatTimeSlotShortLabel(slot: TimeSlotDto | null | undefined): string {
  if (!slot) return '—';
  const code = slot.code ?? (slot.turn && slot.dayCode && slot.slotCode
    ? `${slot.turn}${slot.dayCode}${slot.slotCode}`
    : null);
  if (code) {
    const parsed = parseCode(code);
    if (parsed) {
      const turnLabel = TURN_LABELS[parsed.turn] ?? parsed.turn;
      const dayLabel = DAY_CODE_LABELS[parsed.dayCode] ?? parsed.dayCode;
      const slotLabel = SLOT_LABELS[parsed.slotCode] ?? parsed.slotCode;
      return `${turnLabel}, ${dayLabel}, ${slotLabel}`;
    }
  }
  if (slot.dayOfWeek != null && slot.startTime != null && slot.endTime != null) {
    return `${slot.dayOfWeek} ${slot.startTime}–${slot.endTime}`;
  }
  return String(slot.id);
}

/** Period of day filter: M, T, N (Manhã, Tarde, Noite) */
export const PERIOD_OPTIONS: { label: string; value: string | null }[] = [
  { label: 'Todos', value: null },
  { label: 'Manhã', value: 'M' },
  { label: 'Tarde', value: 'T' },
  { label: 'Noite', value: 'N' },
];
