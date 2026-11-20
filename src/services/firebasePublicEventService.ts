import type { FestEvent } from '../types/festronix';
import { firebaseApp } from '../lib/firebase';
import { callFirebaseCallable } from './firebaseFunctionClient';

const EVENT_CATEGORIES = new Set([
  'technical',
  'workshop',
  'hackathon',
  'non-technical',
  'gaming',
  'departmental',
]);
const EVENT_FORMATS = new Set(['individual', 'duo', 'team']);

function requiredText(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Firebase public event data is invalid.');
  return value;
}

function requiredNumber(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('Firebase public event data is invalid.');
  }
  return value;
}

function eventDeadline(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    const date = value.toDate();
    if (date instanceof Date && Number.isFinite(date.getTime())) return date.toISOString();
  }
  throw new Error('Firebase public event data is invalid.');
}

function publicEventFromDocument(id: string, raw: Record<string, unknown>): FestEvent {
  if (
    raw.isPublished !== true ||
    raw.id !== id ||
    raw.status !== 'open' ||
    raw.approvalStatus !== 'approved' ||
    !EVENT_CATEGORIES.has(String(raw.category)) ||
    !EVENT_FORMATS.has(String(raw.format))
  ) {
    throw new Error('Firebase public event data failed validation.');
  }

  const rawRules = Array.isArray(raw.rules) ? raw.rules : [];
  const rawFaqs = Array.isArray(raw.faqs) ? raw.faqs : [];
  const rawPrizes = raw.prizes && typeof raw.prizes === 'object'
    ? raw.prizes as Record<string, unknown>
    : {};

  return {
    id,
    slug: requiredText(raw.slug),
    title: requiredText(raw.title),
    tagline: typeof raw.tagline === 'string' ? raw.tagline : undefined,
    departmentId: typeof raw.departmentId === 'string' ? raw.departmentId : undefined,
    departmentCode: requiredText(raw.departmentCode),
    category: raw.category as FestEvent['category'],
    format: raw.format as FestEvent['format'],
    minTeamSize: requiredNumber(raw.minTeamSize),
    maxTeamSize: requiredNumber(raw.maxTeamSize),
    fee: requiredNumber(raw.fee),
    capacity: requiredNumber(raw.capacity),
    registeredCount: requiredNumber(raw.registeredCount),
    deadline: eventDeadline(raw.deadline),
    date: requiredText(raw.date),
    time: requiredText(raw.time),
    venue: requiredText(raw.venue),
    description: requiredText(raw.description),
    rules: rawRules.map(requiredText),
    prizes: {
      first: typeof rawPrizes.first === 'string' ? rawPrizes.first : 'Trophy',
      second: typeof rawPrizes.second === 'string' ? rawPrizes.second : undefined,
      third: typeof rawPrizes.third === 'string' ? rawPrizes.third : undefined,
      special: typeof rawPrizes.special === 'string' ? rawPrizes.special : undefined,
    },
    eligibility: typeof raw.eligibility === 'string' ? raw.eligibility : undefined,
    coordinatorName: requiredText(raw.coordinatorName),
    coordinatorPhone: requiredText(raw.coordinatorPhone),
    coordinatorEmail: requiredText(raw.coordinatorEmail),
    status: 'open',
    faqs: rawFaqs.map((faq) => {
      if (!faq || typeof faq !== 'object') throw new Error('Firebase public event data is invalid.');
      const record = faq as Record<string, unknown>;
      return { question: requiredText(record.question), answer: requiredText(record.answer) };
    }),
    approvalStatus: 'approved',
  };
}

/**
 * Reads only the published event projection from Firebase.
 * Display data is not authoritative for price, capacity, approval, or checkout;
 * a trusted registration backend must validate those values again.
 */
export async function fetchFirebasePublicEvents(): Promise<FestEvent[]> {
  if (!firebaseApp) throw new Error('Firebase is not configured.');
  const result = await callFirebaseCallable<{ events: Array<Record<string, unknown> & { id: string }> }>('listPublicEvents', {});
  return (Array.isArray(result.events) ? result.events : [])
    .flatMap(event => {
      try {
        return [publicEventFromDocument(event.id, event)];
      } catch (error) {
        console.warn('Ignoring an invalid Firebase public event projection.', error);
        return [];
      }
    })
    .sort((left, right) => left.title.localeCompare(right.title));
}
