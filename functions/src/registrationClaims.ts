import { createHmac } from 'node:crypto';

export function normalizeRegistrationRoll(value: unknown): string {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

export function normalizeRegistrationTeamCode(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/[^a-z0-9]/gi, '').toUpperCase() : '';
}

export function registrationRollClaimId(eventId: string, rawRoll: unknown, secret: string): string {
  const normalizedEventId = eventId.trim();
  const roll = normalizeRegistrationRoll(rawRoll);
  if (!normalizedEventId || !roll) throw new TypeError('Event ID and participant roll are required for a registration claim.');
  if (Buffer.byteLength(secret, 'utf8') < 32) throw new TypeError('The registration claim secret must be at least 32 bytes.');
  const hash = createHmac('sha256', secret).update(`${normalizedEventId}\0${roll}`, 'utf8').digest('hex');
  return `${normalizedEventId}__${hash}`;
}
