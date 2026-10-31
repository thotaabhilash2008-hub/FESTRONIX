import type { FestEvent } from '../types/festronix';

const DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/;
const TIME_SUFFIX = /(?:T|\s)(\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?(Z|[+-]\d{2}:?\d{2})?$/i;

function endOfLocalDay(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 23, 59, 59, 999);
}

/**
 * Event deadlines entered as dates (without a time) mean the end of that
 * calendar day. Midnight timestamps are treated the same way because older
 * event records stored date-only values as midnight.
 */
export function getEffectiveRegistrationDeadline(value?: string | null): Date | null {
  const deadline = value?.trim();
  if (!deadline) return null;

  const datePrefix = deadline.match(DATE_PREFIX);
  const time = deadline.match(TIME_SUFFIX);
  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) return null;

  if (!time) {
    if (datePrefix) {
      return endOfLocalDay(Number(datePrefix[1]), Number(datePrefix[2]), Number(datePrefix[3]));
    }
    parsed.setHours(23, 59, 59, 999);
    return parsed;
  }

  const isMidnight = Number(time[1]) === 0
    && Number(time[2]) === 0
    && Number(time[3] || 0) === 0
    && !(time[4] || '').replace(/0/g, '');
  if (isMidnight) {
    if (datePrefix) {
      return endOfLocalDay(Number(datePrefix[1]), Number(datePrefix[2]), Number(datePrefix[3]));
    }
    if (parsed.getHours() === 0 && parsed.getMinutes() === 0 && parsed.getSeconds() === 0) {
      parsed.setHours(23, 59, 59, 999);
      return parsed;
    }
  }

  return parsed;
}

export function getEventRegistrationBlockReason(
  event: FestEvent,
  requestedPasses = 1,
  now = new Date()
): string | null {
  if (event.approvalStatus && event.approvalStatus !== 'approved') {
    return event.approvalStatus === 'pending'
      ? 'This event is waiting for approval.'
      : 'This event is not approved for registration.';
  }

  if (!['open', 'upcoming'].includes(event.status)) {
    return event.status === 'full'
      ? 'This event has reached capacity.'
      : `Registration is closed for this event (${event.status.replace(/_/g, ' ')}).`;
  }

  const capacity = Number(event.capacity);
  const registered = Number(event.registeredCount);
  if (!Number.isFinite(capacity) || capacity <= 0) return 'This event has no available capacity.';
  if ((Number.isFinite(registered) ? Math.max(0, registered) : 0) + Math.max(1, requestedPasses) > capacity) {
    return 'There are not enough seats remaining for this order.';
  }

  const deadline = getEffectiveRegistrationDeadline(event.deadline);
  if (deadline && now.getTime() > deadline.getTime()) {
    return `The registration deadline passed on ${deadline.toLocaleString()}.`;
  }

  return null;
}

/** Convert a date-only deadline to the end of that day before storing it. */
export function registrationDeadlineToIso(value?: string | null): string | null {
  const deadline = getEffectiveRegistrationDeadline(value);
  return deadline ? deadline.toISOString() : null;
}
