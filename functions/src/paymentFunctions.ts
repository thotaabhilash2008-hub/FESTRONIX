import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { toDataURL } from 'qrcode';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { defineSecret, defineString } from 'firebase-functions/params';
import { HttpsError, onCall, onRequest, type Request, type Response } from 'firebase-functions/v2/https';
import { normalizeRegistrationRoll, normalizeRegistrationTeamCode, registrationRollClaimId } from './registrationClaims';

const RAZORPAY_KEY_ID = defineSecret('RAZORPAY_KEY_ID');
const RAZORPAY_KEY_SECRET = defineSecret('RAZORPAY_KEY_SECRET');
const RAZORPAY_WEBHOOK_SECRET = defineSecret('RAZORPAY_WEBHOOK_SECRET');
const REGISTRATION_ROLL_CLAIM_SECRET = defineSecret('REGISTRATION_ROLL_CLAIM_SECRET');
const BREVO_API_KEY = defineSecret('BREVO_API_KEY');
const RAZORPAY_MODE = defineString('RAZORPAY_MODE', { default: 'live' });
const PUBLIC_SITE_URL = defineString('PUBLIC_SITE_URL', { default: 'https://festronix.com' });
const REGISTRATION_MAIL_FROM = defineString('REGISTRATION_MAIL_FROM', { default: '' });

const PAYMENT_ORDER_COLLECTION = 'paymentOrders';
const MAX_ORDER_ITEMS = 10;
const ALLOWED_EVENT_STATUSES = new Set(['open', 'upcoming']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type AnyRecord = Record<string, unknown>;
type CleanMember = { name: string; email: string; phone: string; college: string; rollNumber: string; deptSection: string };
type CleanItem = {
  eventId: string; eventTitle: string; departmentCode: string; buyerRoll: string; leaderName: string;
  leaderEmail: string; leaderPhone: string; leaderCollege: string; leaderRoll: string; format: string;
  fee: number; teammates: CleanMember[]; teamName: string; teamCode: string; teamDocumentId?: string;
};

function clean(value: unknown, max = 1000): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function normalizePhone(value: unknown): string {
  return clean(value, 40).replace(/\D/g, '');
}

function normalizeEmail(value: unknown): string {
  return clean(value, 180).toLowerCase();
}

function eventDeadlineMillis(value: unknown): number | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  const millis = Date.parse(String(value));
  return Number.isFinite(millis) ? millis : null;
}

function getMode(keyId: string): 'live' | 'test' | null {
  const actual = keyId.startsWith('rzp_live_') ? 'live' : keyId.startsWith('rzp_test_') ? 'test' : null;
  return actual && actual === RAZORPAY_MODE.value().trim().toLowerCase() ? actual : null;
}

function basicAuth(keyId: string, keySecret: string): string {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
}

function sendJson(response: Response, status: number, body: unknown): void {
  response.status(status).set('Content-Type', 'application/json; charset=utf-8').send(JSON.stringify(body));
}

function publicSiteUrl(): string {
  return (PUBLIC_SITE_URL.value().trim() || 'https://festronix.com').replace(/\/+$/, '');
}

function configureCors(request: Request, response: Response): boolean {
  const origin = clean(request.get('origin'), 300);
  const configured = publicSiteUrl();
  const allowed = new Set([configured, configured.replace('://www.', '://'), 'https://www.festronix.com', 'https://festronix-fawn.vercel.app']);
  if (process.env.FUNCTIONS_EMULATOR === 'true') {
    allowed.add('http://localhost:3000');
    allowed.add('http://127.0.0.1:3000');
  }
  if (origin && !allowed.has(origin)) {
    sendJson(response, 403, { error: 'This website is not allowed to start a payment.' });
    return false;
  }
  if (origin) response.set('Access-Control-Allow-Origin', origin).set('Vary', 'Origin');
  response.set('Access-Control-Allow-Headers', 'content-type, x-razorpay-signature, x-checkout-request-id');
  response.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.set('Access-Control-Max-Age', '600');
  return true;
}

function requestObject(value: unknown): AnyRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as AnyRecord : {};
}

async function resolveEvent(db: FirebaseFirestore.Firestore, eventRef: string) {
  if (UUID_PATTERN.test(eventRef)) {
    const snapshot = await db.collection('events').doc(eventRef).get();
    if (snapshot.exists) return { id: snapshot.id, data: snapshot.data() as AnyRecord };
  }
  const matches = await db.collection('events').where('slug', '==', eventRef).limit(2).get();
  if (matches.size > 1) throw new Error('An event URL is duplicated in the database. Contact the fest desk.');
  const snapshot = matches.docs[0];
  return snapshot ? { id: snapshot.id, data: snapshot.data() as AnyRecord } : null;
}

function assertEventAcceptsRegistration(id: string, event: AnyRecord): void {
  if (event.is_deleted === true || event.deleted_at) throw new Error('One of the selected events is no longer available.');
  if (!ALLOWED_EVENT_STATUSES.has(String(event.status)) || event.approval_status !== 'approved') {
    throw new Error(`${clean(event.title, 140) || 'This event'} is not accepting registrations.`);
  }
  if (Number(event.capacity) <= 0 || Number(event.registered_count) >= Number(event.capacity)) {
    throw new Error(`${clean(event.title, 140) || 'This event'} has reached capacity.`);
  }
  if (!['individual', 'duo', 'team'].includes(String(event.format))) throw new Error('This event has an unsupported registration format.');
  if (!Number.isSafeInteger(Number(event.fee)) || Number(event.fee) < 0 || Number(event.fee) > 1_000_000) {
    throw new Error(`${clean(event.title, 140) || 'This event'} has an invalid fee.`);
  }
  const deadline = eventDeadlineMillis(event.deadline);
  if (deadline !== null && deadline < Date.now()) throw new Error(`The registration deadline for ${clean(event.title, 140)} has passed.`);
  if (!id) throw new Error('The selected event could not be validated.');
}

function cleanMember(value: unknown): CleanMember {
  const member = requestObject(value);
  return {
    name: clean(member.name, 120),
    email: normalizeEmail(member.email),
    phone: clean(member.phone, 40),
    college: clean(member.college, 180),
    rollNumber: normalizeRegistrationRoll(member.rollNumber ?? member.roll_number).slice(0, 50),
    deptSection: clean(member.deptSection ?? member.dept_section, 80).toUpperCase(),
  };
}

function validateParticipant(item: CleanItem, event: AnyRecord): void {
  const title = clean(event.title, 140) || 'the selected event';
  if (!item.leaderName || !EMAIL_PATTERN.test(item.leaderEmail) || !normalizePhone(item.leaderPhone) || !item.leaderCollege || !item.leaderRoll) {
    throw new Error(`Complete the leader name, valid email, phone, college/institution, and roll number for ${title} before payment.`);
  }
  if (!['individual', 'duo', 'team'].includes(item.format) || item.format !== event.format) {
    throw new Error(`${title} no longer supports the selected registration format.`);
  }
  if (item.format === 'individual' && item.teammates.length) throw new Error('Individual event passes must be submitted as separate participants.');
  for (const member of item.teammates) {
    if (!member.name || !EMAIL_PATTERN.test(member.email) || !normalizePhone(member.phone) || !member.college || !member.rollNumber) {
      throw new Error(`Every teammate for ${title} must have a name, valid email, phone, college/institution, and roll number.`);
    }
  }
  const rolls = [item.leaderRoll, ...item.teammates.map(member => member.rollNumber)];
  if (new Set(rolls.map(normalizeRegistrationRoll)).size !== rolls.length) {
    throw new Error(`The team roster for ${title} contains duplicate participant roll numbers.`);
  }
  if (item.format !== 'individual') {
    if (!item.teamCode || !item.teamName || !item.teamDocumentId) throw new Error('Enter a team name and all required teammate details before checkout.');
    const size = 1 + item.teammates.length;
    if (size < Number(event.min_team_size || 1)) throw new Error(`This event requires at least ${event.min_team_size} team members.`);
    if (size > Number(event.max_team_size || 1)) throw new Error(`This event permits a maximum of ${event.max_team_size} team members.`);
    if (size > 20) throw new Error('A team can contain at most 20 participants.');
  }
}

function createDisplayId(): string {
  // A short four-digit suffix has only 9,000 values and collides quickly at
  // festival scale. The opaque random suffix keeps IDs readable and unique.
  return `FEST-2026-${randomBytes(5).toString('hex').toUpperCase()}`;
}

function createQrToken(displayId: string): string {
  return `FEST26-${randomBytes(5).toString('hex').slice(0, 7).toUpperCase()}-${displayId.slice(-4)}`;
}

function emailToken(): string {
  return randomBytes(32).toString('hex');
}

function firestoreTimestampText(value: unknown): string | undefined {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
  if (typeof value === 'string') return value;
  return undefined;
}

function mapRegistration(registration: AnyRecord, event: AnyRecord, fee: number, paymentId: string, orderId: string, eventFee = fee, deliveryToken = '') {
  return {
    id: registration.display_id,
    uuid: registration.id,
    eventId: registration.event_id,
    eventTitle: registration.event_title,
    leaderName: registration.leader_name,
    leaderEmail: registration.leader_email,
    leaderPhone: registration.leader_phone,
    leaderCollege: registration.leader_college,
    leaderRoll: registration.leader_roll,
    teamName: registration.team_name || undefined,
    teamCode: registration.team_code || undefined,
    format: registration.format,
    fee,
    source: 'online',
    paymentStatus: eventFee === 0 ? 'not_applicable' : 'verified',
    paymentMethod: eventFee === 0 ? 'none' : 'razorpay',
    transactionId: eventFee === 0 ? undefined : paymentId,
    razorpayOrderId: eventFee === 0 ? undefined : orderId,
    razorpayPaymentId: eventFee === 0 ? undefined : paymentId,
    emailDeliveryToken: EMAIL_PATTERN.test(normalizeEmail(registration.leader_email))
      ? deliveryToken || undefined
      : undefined,
    qrToken: registration.qr_token,
    checkedIn: false,
    registrationDate: registration.created_at,
    departmentCode: event.department_code,
    teammates: registration.teammates || [],
  };
}

async function buildCheckoutPayload(db: FirebaseFirestore.Firestore, requestBody: AnyRecord, allowFree = false) {
  const requestedEvent = clean(requestBody.eventId ?? requestBody.event_id, 160);
  const rawItems = Array.isArray(requestBody.items) ? requestBody.items : [];
  if (!requestedEvent || rawItems.length < 1 || rawItems.length > MAX_ORDER_ITEMS) {
    throw new Error('A valid event and between 1 and 10 registration items are required.');
  }
  const eventRefs = [...new Set(rawItems.map(item => clean(requestObject(item).eventId ?? requestObject(item).event_id ?? requestedEvent, 160)))];
  if (!eventRefs.includes(requestedEvent)) eventRefs.unshift(requestedEvent);
  const eventsByReference = new Map<string, { id: string; data: AnyRecord }>();
  const eventIds = new Set<string>();
  for (const eventRef of eventRefs) {
    const resolved = await resolveEvent(db, eventRef);
    if (!resolved) throw new Error('One of the selected events could not be found.');
    assertEventAcceptsRegistration(resolved.id, resolved.data);
    eventsByReference.set(eventRef, resolved);
    eventsByReference.set(resolved.id, resolved);
    if (typeof resolved.data.slug === 'string') eventsByReference.set(resolved.data.slug, resolved);
    eventIds.add(resolved.id);
  }

  const items: CleanItem[] = [];
  for (const raw of rawItems) {
    const value = requestObject(raw);
    const requested = clean(value.eventId ?? value.event_id ?? requestedEvent, 160);
    const event = eventsByReference.get(requested);
    if (!event) throw new Error('One of the selected events could not be validated.');
    let roster: CleanMember[] = Array.isArray(value.teammates) ? value.teammates.map(cleanMember) : [];
    let teamName = clean(value.teamName ?? value.team_name, 120);
    let teamCode = clean(value.teamCode ?? value.team_code, 40);
    let teamDocumentId = '';
    let leaderName = clean(value.leaderName ?? value.leader_name, 120);
    let leaderEmail = normalizeEmail(value.leaderEmail ?? value.leader_email);
    let leaderPhone = clean(value.leaderPhone ?? value.leader_phone, 40);
    let leaderCollege = clean(value.leaderCollege ?? value.leader_college, 180);
    let leaderRoll = normalizeRegistrationRoll(value.leaderRoll ?? value.leader_roll).slice(0, 50);

    if (event.data.format !== 'individual') {
      const normalizedTeamCode = normalizeRegistrationTeamCode(teamCode);
      if (!/^[A-Z0-9][A-Z0-9-]{3,39}$/i.test(teamCode) || normalizedTeamCode.length < 6 || !teamName) {
        throw new Error('Enter a valid team name and retry checkout.');
      }
      // The team document is not reserved while the form is being edited or
      // while payment is pending. Its stable ID lets the payment finalizer
      // create the team and all passes atomically after verified payment.
      teamDocumentId = `team_${createHash('sha256').update(`${event.id}:${normalizedTeamCode}`).digest('hex').slice(0, 48)}`;
      const teamRef = db.collection('teams').doc(teamDocumentId);
      const [existingTeam, normalizedCodeMatches, legacyCodeMatches] = await Promise.all([
        teamRef.get(),
        db.collection('teams').where('lookup_team_code', '==', normalizedTeamCode).limit(2).get(),
        db.collection('teams').where('team_code', '==', teamCode.toUpperCase()).limit(2).get(),
      ]);
      const codeMatches = new Map([...normalizedCodeMatches.docs, ...legacyCodeMatches.docs].map(document => [document.id, document]));
      if (codeMatches.size > 0 || existingTeam.exists) {
        throw new Error('This team checkout reference has already been used. Refresh the registration form and retry.');
      }
      teamCode = teamCode.toUpperCase();
    }

    const item: CleanItem = {
      eventId: event.id,
      eventTitle: clean(event.data.title, 140),
      departmentCode: clean(event.data.department_code, 30),
      buyerRoll: normalizeRegistrationRoll(value.buyerRoll ?? value.buyer_roll).slice(0, 50),
      leaderName,
      leaderEmail,
      leaderPhone,
      leaderCollege,
      leaderRoll,
      format: String(event.data.format),
      fee: Number(event.data.fee),
      teammates: roster,
      teamName,
      teamCode,
      ...(teamDocumentId ? { teamDocumentId } : {}),
    };
    validateParticipant(item, event.data);
    items.push(item);
  }

  if (items.some(item => item.format !== 'individual') && items.length > 1) {
    throw new Error('Team event checkout must be completed separately from individual passes.');
  }
  const requestedRolls = new Set<string>();
  const participantCounts = new Map<string, number>();
  for (const item of items) {
    const rolls = [item.leaderRoll, ...item.teammates.map(member => member.rollNumber)];
    for (const roll of rolls) {
      const key = `${item.eventId}:${normalizeRegistrationRoll(roll)}`;
      if (requestedRolls.has(key)) throw new Error(`The order contains duplicate participant roll number ${roll}.`);
      requestedRolls.add(key);
    }
    participantCounts.set(item.eventId, (participantCounts.get(item.eventId) || 0) + rolls.length);
  }
  const amountPaise = items.reduce((sum, item) => sum + Math.round(item.fee * 100), 0);
  if (!Number.isSafeInteger(amountPaise) || amountPaise < 0 || (!allowFree && amountPaise === 0)) throw new Error('The payment amount is invalid.');
  return { requestedEvent, items, amountPaise, eventIds: [...eventIds], participantCounts, requestedRolls };
}

function requestFingerprint(items: CleanItem[]): string {
  return createHash('sha256').update(JSON.stringify(items)).digest('hex');
}

async function callRazorpay(path: string, keyId: string, keySecret: string, init?: RequestInit) {
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    ...init,
    headers: { Authorization: basicAuth(keyId, keySecret), ...(init?.headers || {}) },
    signal: AbortSignal.timeout(12_000),
  });
  const body = await response.json().catch(() => ({})) as AnyRecord;
  return { response, body };
}

async function rateLimit(request: Request, route: string, subject = ''): Promise<boolean> {
  // Fall back to the socket address so local dev (no proxy headers) is not
  // treated as an attacker; Vercel and Cloud Functions set request.ip.
  const ip = clean(request.ip || request.get('x-forwarded-for')?.split(',')[0] || request.socket?.remoteAddress, 100);
  if (!ip) return false;
  const secret = REGISTRATION_ROLL_CLAIM_SECRET.value();
  const minuteBucket = Math.floor(Date.now() / 60_000);
  const actor = subject ? `subject:${subject}` : `ip:${ip}`;
  const key = createHmac('sha256', secret).update(`${route}\0${actor}\0${minuteBucket}`).digest('hex');
  const db = getFirestore();
  const ref = db.collection('publicRateLimits').doc(key);
  return db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    const next = Number(snapshot.get('count') || 0) + 1;
    const limit = route === 'create-order' ? 20
      : route === 'resend-pass-email' ? 3
        : route === 'resend-pass-email-recipient' ? 2
        : route === 'pass-lookup' ? 20 : 40;
    if (next > limit) return false;
    transaction.set(ref, { count: next, expires_at: Timestamp.fromMillis((minuteBucket + 10) * 60_000) });
    return true;
  });
}

export const createRazorpayOrder = onRequest({
  region: 'asia-south1',
  timeoutSeconds: 60,
  memory: '512MiB',
  maxInstances: 20,
  secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, REGISTRATION_ROLL_CLAIM_SECRET],
}, async (request, response) => {
  if (!configureCors(request, response)) return;
  if (request.method === 'OPTIONS') { response.status(204).send(''); return; }
  if (request.method !== 'POST') { sendJson(response, 405, { error: 'Method not allowed.' }); return; }
  const keyId = RAZORPAY_KEY_ID.value().trim();
  const keySecret = RAZORPAY_KEY_SECRET.value();
  const mode = getMode(keyId);
  if (!mode || !keySecret) { sendJson(response, 503, { error: 'Live Razorpay credentials are not configured correctly in Firebase.' }); return; }
  try {
    if (!await rateLimit(request, 'create-order')) { sendJson(response, 429, { error: 'Too many payment attempts. Wait a minute and try again.' }); return; }
    const body = requestObject(request.body);
    const requestId = clean(body.requestId ?? request.get('x-checkout-request-id'), 80);
    if (!UUID_PATTERN.test(requestId)) { sendJson(response, 400, { error: 'A valid checkout request ID is required. Refresh the checkout and try again.' }); return; }
    const db = getFirestore();
    const checkout = await buildCheckoutPayload(db, body);
    const fingerprint = requestFingerprint(checkout.items);
    const receipt = `FEST26-${requestId.replaceAll('-', '').slice(0, 30)}`;
    const paymentOrderId = requestId;
    const orderRef = db.collection(PAYMENT_ORDER_COLLECTION).doc(paymentOrderId);
    const requestRef = db.collection('paymentCheckoutRequests').doc(requestId);
    const isNew = await db.runTransaction(async transaction => {
      const existingRequest = await transaction.get(requestRef);
      if (existingRequest.exists) {
        if (existingRequest.get('fingerprint') !== fingerprint) throw new Error('This checkout request ID was already used for different participant details. Refresh and retry.');
        const existingOrder = await transaction.get(orderRef);
        if (existingOrder.exists && existingOrder.get('status') === 'created' && existingOrder.get('razorpay_order_id')) return false;
        throw new Error('This checkout is already being processed. Wait a moment, then retry verification or refresh checkout.');
      }
      const eventRefs = checkout.eventIds.map(id => db.collection('events').doc(id));
      const eventSnapshots = await Promise.all(eventRefs.map(ref => transaction.get(ref)));
      for (let index = 0; index < eventSnapshots.length; index += 1) {
        const snapshot = eventSnapshots[index];
        if (!snapshot.exists) throw new Error('One of the selected events is no longer available.');
        const event = snapshot.data() as AnyRecord;
        assertEventAcceptsRegistration(snapshot.id, event);
        const participantCount = checkout.participantCounts.get(snapshot.id) || 0;
        if (Number(event.registered_count || 0) + participantCount > Number(event.capacity || 0)) {
          throw new Error(`${clean(event.title, 140)} does not have enough remaining seats for this order.`);
        }
      }
      const now = new Date().toISOString();
      transaction.create(orderRef, {
        id: paymentOrderId,
        receipt,
        event_id: checkout.items[0].eventId,
        amount_paise: checkout.amountPaise,
        currency: 'INR',
        status: 'creating',
        payload: { eventIds: checkout.eventIds, items: checkout.items },
        created_at: now,
        updated_at: now,
        refund_status: 'not_requested',
      });
      transaction.create(requestRef, { fingerprint, order_id: paymentOrderId, state: 'creating', created_at: now });
      return true;
    });

    if (!isNew) {
      const existing = await orderRef.get();
      sendJson(response, 200, {
        success: true, keyId, orderId: existing.get('razorpay_order_id'), amount: existing.get('amount_paise'),
        currency: existing.get('currency'), mode, receipt: existing.get('receipt'),
        eventTitle: checkout.eventIds.length === 1 ? checkout.items[0].eventTitle : `${checkout.items.length} FESTRONIX passes`,
      });
      return;
    }

    const { response: gatewayResponse, body: gatewayOrder } = await callRazorpay('orders', keyId, keySecret, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: checkout.amountPaise, currency: 'INR', receipt,
        notes: { fest: 'FESTRONIX 2026', event_id: checkout.items[0].eventId, event_count: String(checkout.eventIds.length) } }),
    });
    if (!gatewayResponse.ok || typeof gatewayOrder.id !== 'string') {
      await orderRef.update({ status: 'failed', last_error: 'Razorpay order creation failed.', updated_at: new Date().toISOString() });
      await requestRef.update({ state: 'failed', updated_at: new Date().toISOString() });
      sendJson(response, 502, { error: 'Razorpay could not create the payment order. Please retry checkout.' });
      return;
    }
    const now = new Date().toISOString();
    await db.runTransaction(async transaction => {
      const claimRef = db.collection('razorpayOrderClaims').doc(String(gatewayOrder.id));
      const claim = await transaction.get(claimRef);
      if (claim.exists) throw new Error('Razorpay returned an order ID that is already linked. Contact the fest desk.');
      transaction.create(claimRef, { payment_order_id: paymentOrderId, created_at: now });
      transaction.update(orderRef, { razorpay_order_id: gatewayOrder.id, status: 'created', updated_at: now });
      transaction.update(requestRef, { state: 'created', updated_at: now });
    });
    sendJson(response, 200, {
      success: true, keyId, orderId: gatewayOrder.id, amount: checkout.amountPaise, currency: 'INR', mode,
      eventTitle: checkout.eventIds.length === 1 ? checkout.items[0].eventTitle : `${checkout.items.length} FESTRONIX passes`, receipt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to start the payment checkout.';
    sendJson(response, 409, { error: message });
  }
});

function signaturesMatch(expected: string, supplied: string): boolean {
  const left = Buffer.from(expected, 'hex');
  const right = Buffer.from(supplied, 'hex');
  return left.length === 32 && right.length === left.length && timingSafeEqual(left, right);
}

async function getOrderByRazorpayId(db: FirebaseFirestore.Firestore, razorpayOrderId: string) {
  const claim = await db.collection('razorpayOrderClaims').doc(razorpayOrderId).get();
  if (!claim.exists) return null;
  const orderId = clean(claim.get('payment_order_id'), 80);
  if (!orderId) return null;
  const order = await db.collection(PAYMENT_ORDER_COLLECTION).doc(orderId).get();
  return order.exists ? { ref: order.ref, data: order.data() as AnyRecord } : null;
}

async function refundCapturedPayment(paymentId: string, orderId: string, amount: number, alreadyRefunded: number, keyId: string, keySecret: string) {
  const remaining = Math.max(0, amount - alreadyRefunded);
  if (!Number.isSafeInteger(amount) || amount <= 0) return { success: false, error: 'The captured payment amount is invalid for a refund.' };
  if (remaining === 0) return { success: true, alreadyRefunded: true };
  try {
    const { response, body } = await callRazorpay(`payments/${encodeURIComponent(paymentId)}/refunds`, keyId, keySecret, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: remaining, receipt: `FEST-${orderId}`.slice(0, 40), notes: { reason: 'registration_finalization_failed', razorpay_order_id: orderId } }),
    });
    if (response.ok && typeof body.id === 'string') return { success: true, refundId: body.id };
    const recheck = await callRazorpay(`payments/${encodeURIComponent(paymentId)}`, keyId, keySecret);
    if (recheck.response.ok && Number(recheck.body.amount_refunded || 0) >= amount) return { success: true, alreadyRefunded: true };
    return { success: false, error: clean(requestObject(body.error).description ?? requestObject(body.error).reason, 400) || 'Razorpay refund could not be created.' };
  } catch {
    return { success: false, error: 'Razorpay refund request could not reach the payment gateway.' };
  }
}

async function persistRefundOutcome(orderRef: FirebaseFirestore.DocumentReference, current: AnyRecord, paymentId: string, reason: string, refund: AnyRecord) {
  const now = new Date().toISOString();
  await orderRef.update({
    status: current.status === 'paid' ? 'paid' : refund.success ? 'failed' : 'attempted',
    razorpay_payment_id: current.status === 'paid' ? current.razorpay_payment_id : paymentId,
    refund_status: refund.success ? 'succeeded' : 'failed',
    refund_id: refund.refundId || current.refund_id || null,
    refund_payment_id: paymentId,
    refund_error: refund.success ? null : clean(refund.error, 500) || 'Refund failed.',
    last_error: refund.success ? reason : `${reason} Refund requires manual review.`,
    updated_at: now,
  });
}

function prepareRegistration(db: FirebaseFirestore.Firestore, eventId: string, event: AnyRecord, item: CleanItem,
  paymentId: string, orderId: string, participant: { name: string; email: string; phone: string; college: string; roll: string; isLeader: boolean },
  registrationId: string, displayId: string, token: string, deliveryToken: string, now: string) {
  const fee = participant.isLeader ? item.fee : 0;
  const data = {
    id: registrationId,
    display_id: displayId,
    user_id: null,
    buyer_roll: participant.isLeader ? item.buyerRoll || null : participant.roll,
    event_id: eventId,
    event_title: clean(event.title, 140),
    leader_name: participant.name,
    leader_email: participant.email,
    lookup_email: normalizeEmail(participant.email),
    leader_phone: participant.phone,
    leader_college: participant.college,
    leader_roll: participant.roll,
    lookup_roll: normalizeRegistrationRoll(participant.roll),
    format: item.format,
    fee,
    source: 'online',
    payment_status: item.fee === 0 ? 'not_applicable' : 'verified',
    payment_method: item.fee === 0 ? 'none' : 'razorpay',
    transaction_id: item.fee === 0 ? null : paymentId,
    payment_screenshot_url: null,
    rejection_reason: null,
    verified_by: null,
    verified_at: now,
    spot_registered_by: null,
    team_name: item.teamName || null,
    team_code: item.teamCode || null,
    department_code: clean(event.department_code, 30),
    checked_in: false,
    razorpay_order_id: item.fee === 0 ? null : orderId,
    razorpay_payment_id: item.fee === 0 ? null : paymentId,
    created_at: now,
    updated_at: now,
    qr_token: token,
  };
  const deliveryData = {
    id: randomUUID(),
    registration_id: registrationId,
    recipient_email: participant.email,
    delivery_token: deliveryToken,
    status: 'queued',
    attempts: 0,
    last_error: null,
    sent_at: null,
    created_at: now,
    updated_at: now,
  };
  return { data, deliveryData, fee, client: mapRegistration({ ...data, teammates: participant.isLeader ? item.teammates : [] }, event, fee, paymentId, orderId, item.fee, deliveryToken) };
}

async function finalizeCapturedOrder(db: FirebaseFirestore.Firestore, orderRef: FirebaseFirestore.DocumentReference,
  paymentId: string, razorpayOrderId: string, claimSecret: string, freeRegistration = false): Promise<AnyRecord> {
  return db.runTransaction(async transaction => {
    const orderSnapshot = await transaction.get(orderRef);
    if (!orderSnapshot.exists) throw new Error('The payment order could not be found.');
    const order = orderSnapshot.data() as AnyRecord;
    if (freeRegistration) {
      if (order.kind !== 'free_registration' || Number(order.amount_paise) !== 0 || order.status === 'failed') {
        throw new Error('This free registration request is not available for finalization.');
      }
      if (order.status === 'completed' && order.result_payload) return order.result_payload as AnyRecord;
    } else {
      if (order.status === 'paid' && order.razorpay_payment_id === paymentId && order.result_payload) return order.result_payload as AnyRecord;
      if (!['created', 'attempted'].includes(String(order.status))) throw new Error('This payment order is not available for registration finalization.');
    }
    const payload = requestObject(order.payload);
    const items = Array.isArray(payload.items) ? payload.items.map(value => requestObject(value) as unknown as CleanItem) : [];
    if (items.length < 1 || items.length > MAX_ORDER_ITEMS) throw new Error('The payment order has an invalid registration roster.');
    if (freeRegistration && items.some(item => item.fee !== 0)) throw new Error('A free registration request cannot contain a paid event.');
    if (items.some(item => item.format !== 'individual') && items.length > 1) throw new Error('Team event checkout cannot be combined with other event passes.');
    const eventIds = [...new Set(items.map(item => item.eventId))];
    const eventRefs = eventIds.map(id => db.collection('events').doc(id));
    const eventSnapshots = await Promise.all(eventRefs.map(ref => transaction.get(ref)));
    const teamDocumentIds = [...new Set(items.map(item => clean((item as CleanItem & { teamDocumentId?: string }).teamDocumentId, 80)).filter(Boolean))];
    const teamRefs = teamDocumentIds.map(id => db.collection('teams').doc(id));
    const teamSnapshots = await Promise.all(teamRefs.map(ref => transaction.get(ref)));
    const claimKeys = new Map<string, { eventId: string; roll: string; teamCode: string }>();
    for (const item of items) {
      for (const roll of [item.leaderRoll, ...item.teammates.map(member => member.rollNumber)]) {
        const claimId = registrationRollClaimId(item.eventId, roll, claimSecret);
        claimKeys.set(claimId, { eventId: item.eventId, roll, teamCode: normalizeRegistrationTeamCode(item.teamCode) });
      }
    }
    const claimRefs = [...claimKeys.keys()].map(id => db.collection('registrationRollClaims').doc(id));
    const claimSnapshots = await Promise.all(claimRefs.map(ref => transaction.get(ref)));
    const requestedPassCount = items.reduce((count, item) => count + 1 + item.teammates.length, 0);
    const displayIds: string[] = [];
    const uniqueDisplayIds = new Set<string>();
    while (displayIds.length < requestedPassCount) {
      const displayId = createDisplayId();
      if (uniqueDisplayIds.has(displayId)) continue;
      uniqueDisplayIds.add(displayId);
      displayIds.push(displayId);
    }
    const ticketTokens = displayIds.map(displayId => createQrToken(displayId));
    const deliveryTokens = items.flatMap(item => item.teammates.length
      ? [emailToken(), ...item.teammates.map(member => member.email ? emailToken() : '')]
      : [emailToken()]);
    const displayRefs = displayIds.map(value => db.collection('registrationDisplayClaims').doc(value));
    const tokenRefs = ticketTokens.map(value => db.collection('ticketTokenClaims').doc(createHash('sha256').update(value).digest('hex')));
    const displaySnapshots = await Promise.all(displayRefs.map(ref => transaction.get(ref)));
    const tokenSnapshots = await Promise.all(tokenRefs.map(ref => transaction.get(ref)));
    if (displaySnapshots.some(snapshot => snapshot.exists) || tokenSnapshots.some(snapshot => snapshot.exists)) {
      throw new Error('Could not allocate unique pass identifiers. Retry the payment verification.');
    }
    for (let index = 0; index < claimSnapshots.length; index += 1) {
      const snapshot = claimSnapshots[index];
      if (!snapshot.exists) continue;
      const current = snapshot.data() as AnyRecord;
      const requestedTeamCode = claimKeys.get(snapshot.id)?.teamCode || '';
      const storedCodes = Array.isArray(current.team_codes) ? current.team_codes.map(normalizeRegistrationTeamCode).filter(Boolean) : [];
      if (current.conflict === true || !requestedTeamCode || storedCodes.length !== 1 || storedCodes[0] !== requestedTeamCode) {
        throw new Error(`A participant is already registered for ${items.find(item => item.eventId === claimKeys.get(snapshot.id)?.eventId)?.eventTitle || 'this event'}. Use the existing pass instead of paying again.`);
      }
    }
    for (let index = 0; index < teamSnapshots.length; index += 1) {
      const teamSnapshot = teamSnapshots[index];
      const item = items.find(candidate => (candidate as CleanItem & { teamDocumentId?: string }).teamDocumentId === teamSnapshot.id);
      if (!teamSnapshot.exists) continue;
      const currentTeam = teamSnapshot.data() as AnyRecord;
      if (!item || normalizeRegistrationTeamCode(currentTeam.team_code) !== normalizeRegistrationTeamCode(item.teamCode) ||
          normalizeRegistrationRoll(currentTeam.leader_roll) !== item.leaderRoll ||
          clean(currentTeam.event_id, 160) !== item.eventId) {
        throw new Error('The team record no longer matches this payment order. Contact the fest desk.');
      }
    }
    const registrations: AnyRecord[] = [];
    const registrationIdsForPassClaims: string[] = [];
    const now = new Date().toISOString();
    let registrationCursor = 0;
    const eventSnapshotsById = new Map(eventSnapshots.map(snapshot => [snapshot.id, snapshot]));
    const participantCounts = new Map<string, number>();
    for (const item of items) {
      participantCounts.set(item.eventId, (participantCounts.get(item.eventId) || 0) + 1 + item.teammates.length);
    }
    for (const eventSnapshot of eventSnapshots) {
      if (!eventSnapshot.exists) throw new Error('The registration event no longer exists.');
      const event = eventSnapshot.data() as AnyRecord;
      assertEventAcceptsRegistration(eventSnapshot.id, event);
      const participantCount = participantCounts.get(eventSnapshot.id) || 0;
      if (Number(event.registered_count || 0) + participantCount > Number(event.capacity || 0)) {
        throw new Error(`${clean(event.title, 140)} does not have enough remaining seats for this order.`);
      }
    }

    // Preserve the checkout item order exactly. Multi-pass carts may interleave
    // events, so grouping registrations by event here would mismatch their
    // display IDs, QR tokens, and email delivery tokens.
    for (const item of items) {
      const eventSnapshot = eventSnapshotsById.get(item.eventId);
      if (!eventSnapshot?.exists) throw new Error('The registration event no longer exists.');
      const event = eventSnapshot.data() as AnyRecord;
      const leaderId = randomUUID();
      const leaderDisplayId = displayIds[registrationCursor];
      const leaderQr = ticketTokens[registrationCursor];
      const leaderEmailToken = deliveryTokens[registrationCursor];
      registrationCursor += 1;
      const leader = prepareRegistration(db, eventSnapshot.id, event, item, paymentId, razorpayOrderId,
        { name: item.leaderName, email: item.leaderEmail, phone: item.leaderPhone, college: item.leaderCollege, roll: item.leaderRoll, isLeader: true },
        leaderId, leaderDisplayId, leaderQr, leaderEmailToken, now);
      const leaderRef = db.collection('registrations').doc(leaderId);
      const ticketRef = db.collection('tickets').doc(leaderId);
      const deliveryRef = db.collection('emailDeliveries').doc(leaderEmailToken);
      transaction.create(leaderRef, leader.data);
      transaction.create(ticketRef, { id: leaderId, registration_id: leaderId, qr_token: leaderQr, checked_in: false, checked_in_at: null, checked_in_by: null, created_at: now });
      transaction.create(deliveryRef, leader.deliveryData);
      if (item.teamCode) {
        const teamDocumentId = clean(item.teamDocumentId, 80);
        if (teamDocumentId) {
          const teamRef = db.collection('teams').doc(teamDocumentId);
          const existingTeam = teamSnapshots.find(snapshot => snapshot.id === teamDocumentId);
          const teamData = {
            id: teamDocumentId,
            team_code: item.teamCode,
            lookup_team_code: normalizeRegistrationTeamCode(item.teamCode),
            team_name: item.teamName,
            event_id: eventSnapshot.id,
            event_title: clean(event.title, 140),
            registration_id: leaderDisplayId,
            leader_id: null,
            leader_name: item.leaderName,
            leader_roll: item.leaderRoll,
            leader_email: item.leaderEmail,
            leader_phone: item.leaderPhone,
            leader_college: item.leaderCollege,
            members: item.teammates,
            member_count: item.teammates.length,
            max_team_size: Number(event.max_team_size),
            min_team_size: Number(event.min_team_size),
            created_at: existingTeam?.get('created_at') || now,
            updated_at: now,
          };
          if (existingTeam?.exists) transaction.set(teamRef, teamData, { merge: true });
          else transaction.create(teamRef, teamData);
        }
      }
      registrations.push(leader.client);
      registrationIdsForPassClaims.push(leaderId);
      const participantRegistrationIds = [leaderId];
      for (const member of item.teammates) {
        const memberId = randomUUID();
        const memberDisplay = displayIds[registrationCursor];
        const memberQr = ticketTokens[registrationCursor];
        const memberEmailToken = deliveryTokens[registrationCursor];
        registrationCursor += 1;
        const memberRegistration = prepareRegistration(db, eventSnapshot.id, event, item, paymentId, razorpayOrderId,
          { name: member.name, email: member.email, phone: member.phone, college: member.college, roll: member.rollNumber, isLeader: false },
          memberId, memberDisplay, memberQr, memberEmailToken, now);
        const memberRef = db.collection('registrations').doc(memberId);
        transaction.create(memberRef, memberRegistration.data);
        transaction.create(db.collection('tickets').doc(memberId), { id: memberId, registration_id: memberId, qr_token: memberQr, checked_in: false, checked_in_at: null, checked_in_by: null, created_at: now });
        if (member.email) transaction.create(db.collection('emailDeliveries').doc(memberEmailToken), memberRegistration.deliveryData);
        const memberRecordId = randomUUID();
        transaction.create(db.collection('registrationMembers').doc(memberRecordId), {
          id: memberRecordId,
          registration_id: leaderId,
          name: member.name,
          email: member.email,
          lookup_email: normalizeEmail(member.email),
          phone: member.phone,
          college: member.college,
          roll_number: member.rollNumber,
          lookup_roll: normalizeRegistrationRoll(member.rollNumber),
          created_at: now,
        });
        participantRegistrationIds.push(memberId);
        registrationIdsForPassClaims.push(memberId);
      }
      // The old PostgreSQL trigger represented every teammate both in the
      // leader's member rows and as an individually scannable pass.
      for (const person of [{ roll: item.leaderRoll, registrationIds: [leaderId] }, ...item.teammates.map((member, index) => ({ roll: member.rollNumber, registrationIds: [leaderId, participantRegistrationIds[index + 1]] }))]) {
        const claimId = registrationRollClaimId(eventSnapshot.id, person.roll, claimSecret);
        const claimRef = db.collection('registrationRollClaims').doc(claimId);
        const oldClaim = claimSnapshots.find(snapshot => snapshot.id === claimId)?.data() as AnyRecord | undefined;
        const existingIds = Array.isArray(oldClaim?.registration_ids) ? oldClaim.registration_ids.map(String) : [];
        transaction.set(claimRef, {
          event_id: eventSnapshot.id,
          roll_hash: claimId.slice(eventSnapshot.id.length + 2),
          registration_ids: [...new Set([...existingIds, ...person.registrationIds])].sort(),
          team_codes: item.teamCode ? [normalizeRegistrationTeamCode(item.teamCode)] : [],
          conflict: false,
        });
      }
    }

    for (const eventSnapshot of eventSnapshots) {
      const event = eventSnapshot.data() as AnyRecord;
      const registeredCount = Number(event.registered_count || 0) + (participantCounts.get(eventSnapshot.id) || 0);
      const nextStatus = registeredCount >= Number(event.capacity || 0) ? 'full' : event.status;
      transaction.update(eventSnapshot.ref, { registered_count: registeredCount, status: nextStatus, updated_at: now });
      const publicEventRef = db.collection('publicEvents').doc(eventSnapshot.id);
      if (nextStatus === 'full') transaction.delete(publicEventRef);
      else if (event.status === 'open' && event.approval_status === 'approved') {
        transaction.set(publicEventRef, { registeredCount }, { merge: true });
      }
    }
    for (let index = 0; index < displayRefs.length; index += 1) {
      transaction.create(displayRefs[index], { registration_id: registrationIdsForPassClaims[index], created_at: now });
      transaction.create(tokenRefs[index], { registration_id: registrationIdsForPassClaims[index], created_at: now });
    }
    const result = {
      success: true,
      alreadyFinalized: false,
      razorpayOrderId: freeRegistration ? undefined : razorpayOrderId,
      razorpayPaymentId: freeRegistration ? undefined : paymentId,
      registrations,
    };
    transaction.update(orderRef, {
      status: freeRegistration ? 'completed' : 'paid', razorpay_payment_id: freeRegistration ? null : paymentId, result_payload: result,
      last_error: null, paid_at: now, updated_at: now,
    });
    return result;
  });
}

/**
 * Atomically issue guest passes for an all-free order. It shares the same
 * capacity, roll-claim, ticket, QR, and event-count finalizer as captured
 * Razorpay payments, but never creates a Razorpay payment/order identifier.
 */
export const createFreeRegistrations = onCall({
  region: 'asia-south1', timeoutSeconds: 120, secrets: [REGISTRATION_ROLL_CLAIM_SECRET, BREVO_API_KEY],
}, async request => {
  if (!await rateLimit(request.rawRequest, 'free-registration')) {
    throw new HttpsError('resource-exhausted', 'Too many registration attempts. Wait a minute and try again.');
  }
  const body = requestObject(request.data);
  const requestId = clean(body.requestId, 80).toLowerCase();
  if (!UUID_PATTERN.test(requestId)) throw new HttpsError('invalid-argument', 'The registration request ID is invalid. Refresh and retry.');
  const db = getFirestore();
  let checkout: Awaited<ReturnType<typeof buildCheckoutPayload>>;
  try {
    checkout = await buildCheckoutPayload(db, body, true);
  } catch (error) {
    throw new HttpsError('failed-precondition', error instanceof Error ? error.message : 'The free registration could not be validated.');
  }
  if (checkout.amountPaise !== 0 || checkout.items.some(item => item.fee !== 0)) {
    throw new HttpsError('failed-precondition', 'This request includes a paid event and must use Razorpay checkout.');
  }

  const fingerprint = requestFingerprint(checkout.items);
  const orderRef = db.collection(PAYMENT_ORDER_COLLECTION).doc(`free_${requestId}`);
  const now = new Date().toISOString();
  try {
    await db.runTransaction(async transaction => {
      const existing = await transaction.get(orderRef);
      if (existing.exists) {
        if (existing.get('kind') !== 'free_registration' || existing.get('request_fingerprint') !== fingerprint) {
          throw new HttpsError('already-exists', 'This request ID was already used for different registration details. Refresh and retry.');
        }
        return;
      }
      transaction.create(orderRef, {
        id: orderRef.id,
        kind: 'free_registration',
        request_fingerprint: fingerprint,
        requested_event_id: checkout.requestedEvent,
        event_ids: checkout.eventIds,
        amount_paise: 0,
        currency: 'INR',
        status: 'created',
        payload: { eventIds: checkout.eventIds, items: checkout.items },
        created_at: now,
        updated_at: now,
      });
    });
    const result = await finalizeCapturedOrder(db, orderRef, '', '', REGISTRATION_ROLL_CLAIM_SECRET.value(), true);
    const registrationIds = Array.isArray(result.registrations)
      ? result.registrations.map((registration: AnyRecord) => clean(registration.uuid, 80)).filter(Boolean)
      : [];
    await dispatchRegistrationEmails(db, registrationIds);
    return result;
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('failed-precondition', error instanceof Error ? error.message : 'The free registration could not be completed. Check My Passes before retrying.');
  }
});

async function processCapturedPayment(razorpayOrderId: string, paymentId: string, db: FirebaseFirestore.Firestore): Promise<AnyRecord> {
  const keyId = RAZORPAY_KEY_ID.value().trim();
  const keySecret = RAZORPAY_KEY_SECRET.value();
  const mode = getMode(keyId);
  if (!mode || !keySecret) throw new Error('Razorpay credentials are not configured correctly.');
  const found = await getOrderByRazorpayId(db, razorpayOrderId);
  if (!found) return { ignored: true };
  const order = found.data;
  const { response: paymentResponse, body: payment } = await callRazorpay(`payments/${encodeURIComponent(paymentId)}`, keyId, keySecret);
  const captured = paymentResponse.ok && payment.order_id === razorpayOrderId && payment.status === 'captured' &&
    Number.isSafeInteger(Number(payment.amount)) && Number(payment.amount) > 0;
  if (!captured) throw new Error('Razorpay has not confirmed a captured payment for this order.');
  if (Number(payment.amount) !== Number(order.amount_paise) || payment.currency !== order.currency) {
    const refund = await refundCapturedPayment(paymentId, razorpayOrderId, Number(payment.amount), Number(payment.amount_refunded || 0), keyId, keySecret);
    await persistRefundOutcome(found.ref, order, paymentId, 'Captured payment amount or currency did not match the stored Razorpay order.', refund);
    throw new Error(refund.success ? 'The payment did not match the stored order and has been refunded.' : 'The payment did not match the order; the refund needs manual review.');
  }
  if (order.status === 'paid' && order.result_payload) {
    if (order.razorpay_payment_id === paymentId) {
      await dispatchOrderEmails(db, razorpayOrderId);
      return order.result_payload as AnyRecord;
    }
    const refund = await refundCapturedPayment(paymentId, razorpayOrderId, Number(payment.amount), Number(payment.amount_refunded || 0), keyId, keySecret);
    await persistRefundOutcome(found.ref, order, paymentId, 'An additional captured payment was made for an already paid order.', refund);
    throw new Error(refund.success ? 'This order was already paid. The additional payment has been refunded.' : 'This order was already paid. The additional payment needs manual refund review.');
  }
  if (order.status === 'failed' && order.refund_status === 'succeeded') throw new Error('This payment was refunded because registration could not be completed.');
  try {
    const result = await finalizeCapturedOrder(db, found.ref, paymentId, razorpayOrderId, REGISTRATION_ROLL_CLAIM_SECRET.value());
    await dispatchOrderEmails(db, razorpayOrderId);
    return result;
  } catch (finalizationError) {
    const reason = `Payment was captured but registration finalization failed: ${finalizationError instanceof Error ? finalizationError.message.slice(0, 500) : 'unknown error'}`;
    const currentSnapshot = await found.ref.get();
    const current = currentSnapshot.data() as AnyRecord;
    if (current.status === 'paid' && current.razorpay_payment_id === paymentId && current.result_payload) {
      await dispatchOrderEmails(db, razorpayOrderId);
      return current.result_payload as AnyRecord;
    }
    await found.ref.update({ status: 'attempted', razorpay_payment_id: paymentId, refund_status: 'pending', refund_error: null, last_error: reason, updated_at: new Date().toISOString() });
    const refund = await refundCapturedPayment(paymentId, razorpayOrderId, Number(payment.amount), Number(payment.amount_refunded || 0), keyId, keySecret);
    await persistRefundOutcome(found.ref, current, paymentId, reason, refund);
    if (refund.success) throw new Error(`Payment was captured, but registration could not be completed. The payment was refunded. Refund ID: ${refund.refundId || 'confirmed'}.`);
    throw new Error(`Payment was captured but registration failed. The refund needs manual review for payment ${paymentId}.`);
  }
}

export const verifyRazorpayPayment = onRequest({
  region: 'asia-south1', timeoutSeconds: 120, memory: '512MiB', maxInstances: 20,
  secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, REGISTRATION_ROLL_CLAIM_SECRET, BREVO_API_KEY],
}, async (request, response) => {
  if (!configureCors(request, response)) return;
  if (request.method === 'OPTIONS') { response.status(204).send(''); return; }
  if (request.method !== 'POST') { sendJson(response, 405, { error: 'Method not allowed.' }); return; }
  try {
    if (!await rateLimit(request, 'verify-payment')) { sendJson(response, 429, { error: 'Too many verification attempts. Wait a minute and retry.' }); return; }
    const body = requestObject(request.body);
    const orderId = clean(body.razorpay_order_id, 100);
    const paymentId = clean(body.razorpay_payment_id, 100);
    const signature = clean(body.razorpay_signature, 128).toLowerCase();
    if (!orderId || !paymentId || !/^[a-f0-9]{64}$/.test(signature)) { sendJson(response, 400, { error: 'Razorpay checkout verification data is incomplete.' }); return; }
    const keySecret = RAZORPAY_KEY_SECRET.value();
    const expected = createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    if (!signaturesMatch(expected, signature)) { sendJson(response, 400, { error: 'Razorpay signature verification failed.' }); return; }
    const result = await processCapturedPayment(orderId, paymentId, getFirestore());
    if (result.ignored) { sendJson(response, 404, { error: 'The payment order could not be found.' }); return; }
    sendJson(response, 200, result);
  } catch (error) {
    sendJson(response, 409, { error: error instanceof Error ? error.message : 'Unable to verify the Razorpay payment.' });
  }
});

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character] || character));
}

function parseSender(value: string): { name: string; email: string } | null {
  const input = value.trim();
  const match = input.match(/^(.*?)\s*<([^<>\s]+@[^<>\s]+)>$/);
  const name = match ? match[1].trim() : 'FESTRONIX 2026';
  const email = match ? match[2].trim() : input;
  if (!EMAIL_PATTERN.test(email)) return null;
  return { name: name || 'FESTRONIX 2026', email };
}

async function sendPassEmail(db: FirebaseFirestore.Firestore, deliveryToken: string): Promise<boolean> {
  const deliveryRef = db.collection('emailDeliveries').doc(deliveryToken);
  const deliverySnapshot = await deliveryRef.get();
  if (!deliverySnapshot.exists) return false;
  const delivery = deliverySnapshot.data() as AnyRecord;
  if (delivery.status === 'sent') return true;
  const claimed = await db.runTransaction(async transaction => {
    const currentSnapshot = await transaction.get(deliveryRef);
    if (!currentSnapshot.exists) return false;
    const current = currentSnapshot.data() as AnyRecord;
    if (current.status === 'sent') return false;
    const latestUpdate = Date.parse(String(current.updated_at || ''));
    const stale = current.status === 'sending' && Number.isFinite(latestUpdate) && Date.now() - latestUpdate > 15 * 60_000;
    if (current.status === 'sending' && !stale) return false;
    if (!['queued', 'failed', 'sending'].includes(String(current.status))) return false;
    transaction.update(deliveryRef, { status: 'sending', attempts: Number(current.attempts || 0) + 1, updated_at: new Date().toISOString() });
    return true;
  });
  if (!claimed) return delivery.status === 'sent';

  const registrationId = clean(delivery.registration_id, 80);
  const registrationSnapshot = await db.collection('registrations').doc(registrationId).get();
  if (!registrationSnapshot.exists) {
    await deliveryRef.update({ status: 'failed', last_error: 'The registration record was not found.', updated_at: new Date().toISOString() });
    return false;
  }
  const registration = registrationSnapshot.data() as AnyRecord;
  const ticketSnapshot = await db.collection('tickets').doc(registrationId).get();
  const qrToken = clean(ticketSnapshot.get('qr_token'), 200);
  const eventSnapshot = await db.collection('events').doc(clean(registration.event_id, 80)).get();
  const event = eventSnapshot.exists ? eventSnapshot.data() as AnyRecord : {};
  const displayId = clean(registration.display_id, 80);
  const site = publicSiteUrl();
  const passUrl = `${site}/passes?registration=${encodeURIComponent(displayId)}`;
  const sender = parseSender(REGISTRATION_MAIL_FROM.value());
  const recipient = clean(delivery.recipient_email, 180) || clean(registration.leader_email, 180);
  if (!BREVO_API_KEY.value() || !sender || !EMAIL_PATTERN.test(recipient)) {
    await deliveryRef.update({ status: 'failed', last_error: 'Pass email provider or verified sender is not configured.', updated_at: new Date().toISOString() });
    return false;
  }
  const eventTitle = clean(registration.event_title, 140) || 'FESTRONIX event';
  const participant = clean(registration.leader_name, 120) || 'FESTRONIX participant';
  const fee = Number(registration.fee || 0);
  const paymentStatus = String(registration.payment_status || '');
  const statusLabel = paymentStatus === 'verified' ? 'PAID · CONFIRMED' : paymentStatus === 'not_applicable' ? 'CONFIRMED' : paymentStatus.toUpperCase();
  const safe = (value: unknown) => escapeHtml(value);
  let inlineImage: { cid: string; content: string; name: string } | null = null;
  if (qrToken) {
    try {
      const qrDataUrl = await toDataURL(qrToken, {
        width: 360,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#07111F', light: '#FFFFFF' },
      });
      const content = qrDataUrl.split(',')[1];
      if (content) inlineImage = { cid: 'festronix-pass-qr', content, name: 'festronix-pass-qr.png' };
    } catch {
      // The token text below keeps the pass usable if QR rendering fails.
    }
  }
  const qrBlock = inlineImage
    ? `<div style="margin:22px 0;text-align:center"><div style="display:inline-block;background:#fff;padding:12px;border-radius:12px"><img src="cid:${inlineImage.cid}" alt="FESTRONIX entry QR" width="220" height="220" style="display:block;width:220px;height:220px"></div><div style="margin-top:10px;color:#94a3b8;font-size:12px;word-break:break-all">Token: ${safe(qrToken)}</div></div>`
    : qrToken
      ? `<p><strong>Entry QR token:</strong> ${safe(qrToken)}</p>`
      : '';
  const textContent = [
    'FESTRONIX 2026 DIGITAL PASS', '', `Hello ${participant},`, '', 'Your registration is confirmed.',
    `Event: ${eventTitle}`, `Registration ID: ${displayId}`, `Participant: ${participant}`,
    `Roll number: ${clean(registration.leader_roll, 50) || 'Not provided'}`, `Status: ${statusLabel}`,
    `Date: ${clean(event.date_display, 80)}`, `Time: ${clean(event.time_display, 80)}`, `Venue: ${clean(event.venue, 240)}`,
    `Fee: ₹${fee}`, `Transaction ID: ${clean(registration.transaction_id, 100) || 'Not required'}`,
    ...(qrToken ? [`Entry QR token: ${qrToken}`, 'Your entry QR image is included in this email.'] : []),
    `Open your live pass to display the entry QR: ${passUrl}`,
  ].join('\n');
  const htmlContent = `<!doctype html><html><body style="margin:0;background:#080c16;color:#f8fafc;font-family:Arial,sans-serif;padding:24px"><main style="max-width:560px;margin:auto;background:#121d38;border:1px solid #334155;border-radius:18px;padding:28px"><div style="color:#38bdf8;font-weight:bold;letter-spacing:1px">FESTRONIX 2026 DIGITAL PASS</div><h1 style="font-size:24px">Your registration is confirmed</h1><p>Hello ${safe(participant)},</p><p><strong>${safe(eventTitle)}</strong><br>Registration ID: <strong>${safe(displayId)}</strong></p><p>Status: ${safe(statusLabel)}<br>Date: ${safe(event.date_display)} · ${safe(event.time_display)}<br>Venue: ${safe(event.venue)}<br>Fee: ₹${safe(fee)}</p>${qrBlock}<p>Your entry QR is included in this email and on your digital pass. Show either at the venue.</p><p><a href="${safe(passUrl)}" style="display:inline-block;background:#1684ef;color:white;padding:12px 18px;border-radius:8px;text-decoration:none">Open your pass</a></p><p style="color:#94a3b8;font-size:12px">Keep your pass private. Each ticket is valid for one check-in.</p></main></body></html>`;
  try {
    const providerResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { accept: 'application/json', 'api-key': BREVO_API_KEY.value(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender,
        to: [{ email: recipient, name: participant }],
        subject: `Your FESTRONIX pass — ${eventTitle}`,
        textContent,
        htmlContent,
        ...(inlineImage ? { inlineImage: [inlineImage] } : {}),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!providerResponse.ok) {
      await deliveryRef.update({ status: 'failed', last_error: 'The email provider rejected the pass email.', updated_at: new Date().toISOString() });
      return false;
    }
    await deliveryRef.update({ status: 'sent', sent_at: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString() });
    return true;
  } catch {
    await deliveryRef.update({ status: 'failed', last_error: 'The email provider could not be reached.', updated_at: new Date().toISOString() });
    return false;
  }
}

async function deliverPassEmailWithRetry(db: FirebaseFirestore.Firestore, deliveryId: string): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (await sendPassEmail(db, deliveryId)) return true;
    const latest = await db.collection('emailDeliveries').doc(deliveryId).get();
    if (latest.get('status') === 'sent') return true;
    if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 400 * (attempt + 1)));
  }
  return false;
}

async function dispatchRegistrationEmails(db: FirebaseFirestore.Firestore, registrationIds: string[]): Promise<void> {
  try {
    const ids = [...new Set(registrationIds.map(id => clean(id, 80)).filter(Boolean))].slice(0, 30);
    if (!ids.length) return;
    const deliveries = await db.collection('emailDeliveries').where('registration_id', 'in', ids).limit(30).get();
    await Promise.all(deliveries.docs.map(delivery => deliverPassEmailWithRetry(db, delivery.id).catch(() => false)));
  } catch (error) {
    console.error('Pass email dispatch is queued for retry:', error instanceof Error ? error.message : 'unknown error');
  }
}

async function dispatchOrderEmails(db: FirebaseFirestore.Firestore, razorpayOrderId: string): Promise<void> {
  try {
    const registrations = await db.collection('registrations').where('razorpay_order_id', '==', razorpayOrderId).limit(30).get();
    await dispatchRegistrationEmails(db, registrations.docs.map(document => document.id));
  } catch (error) {
    console.error('Pass email dispatch is queued for retry:', error instanceof Error ? error.message : 'unknown error');
  }
}

export const sendRegistrationPassEmail = onRequest({
  region: 'asia-south1', timeoutSeconds: 45, memory: '256MiB', maxInstances: 10,
  secrets: [BREVO_API_KEY],
}, async (request, response) => {
  if (!configureCors(request, response)) return;
  if (request.method === 'OPTIONS') { response.status(204).send(''); return; }
  if (request.method !== 'POST') { sendJson(response, 405, { error: 'Method not allowed.' }); return; }
  const token = clean(requestObject(request.body).deliveryToken, 80);
  if (!/^[a-f0-9]{64}$/i.test(token)) { sendJson(response, 400, { sent: false, error: 'Invalid email delivery token.' }); return; }
  try {
    const sent = await sendPassEmail(getFirestore(), token);
    sendJson(response, sent ? 200 : 503, { sent, message: sent ? 'The registration pass was emailed successfully.' : 'The pass email could not be sent yet. Please retry or contact the fest desk.' });
  } catch {
    sendJson(response, 500, { sent: false, error: 'Unable to deliver the registration pass email right now.' });
  }
});

/**
 * Resend a pass email without exposing the durable delivery token to the
 * browser. The attendee must provide the exact pass ID and the email stored
 * on that individual pass; only confirmed registrations are eligible.
 */
export const resendRegistrationPassEmail = onRequest({
  region: 'asia-south1', timeoutSeconds: 45, memory: '256MiB', maxInstances: 10,
  secrets: [BREVO_API_KEY, REGISTRATION_ROLL_CLAIM_SECRET],
}, async (request, response) => {
  if (!configureCors(request, response)) return;
  if (request.method === 'OPTIONS') { response.status(204).send(''); return; }
  if (request.method !== 'POST') { sendJson(response, 405, { error: 'Method not allowed.' }); return; }
  try {
    if (!await rateLimit(request, 'resend-pass-email')) {
      sendJson(response, 429, { success: false, sent: false, error: 'Too many email requests. Wait a minute and try again.' });
      return;
    }

    const body = requestObject(request.body);
    const displayId = clean(body.registrationId, 80).toUpperCase();
    const email = normalizeEmail(body.email);
    if (!displayId || !EMAIL_PATTERN.test(email)) {
      sendJson(response, 400, { success: false, sent: false, error: 'Enter the pass ID and attendee email used during registration.' });
      return;
    }

    const db = getFirestore();
    const matches = await db.collection('registrations').where('display_id', '==', displayId).limit(1).get();
    const registration = matches.docs[0];
    if (!registration || normalizeEmail(registration.get('leader_email')) !== email ||
        !['verified', 'not_applicable'].includes(clean(registration.get('payment_status'), 40))) {
      sendJson(response, 404, { success: false, sent: false, error: 'No confirmed pass matched that ID and email.' });
      return;
    }
    if (!await rateLimit(request, 'resend-pass-email-recipient', `${displayId}\0${email}`)) {
      sendJson(response, 429, { success: false, sent: false, error: 'A pass email was requested recently. Wait a minute and try again.' });
      return;
    }

    const token = emailToken();
    const now = new Date().toISOString();
    await db.collection('emailDeliveries').doc(token).create({
      id: randomUUID(),
      registration_id: registration.id,
      recipient_email: email,
      delivery_token: token,
      status: 'queued',
      attempts: 0,
      trigger: 'participant_resend',
      last_error: null,
      sent_at: null,
      created_at: now,
      updated_at: now,
    });

    const sent = await sendPassEmail(db, token);
    sendJson(response, sent ? 200 : 503, {
      success: sent,
      sent,
      message: sent
        ? 'The pass email was sent successfully.'
        : 'The email could not be delivered right now. Please try again later.',
    });
  } catch {
    sendJson(response, 503, { success: false, sent: false, error: 'The pass email could not be delivered right now. Please try again later.' });
  }
});

/**
 * Guest-safe exact-match pass lookup. Private registration collections remain
 * closed to browser clients; this endpoint returns only records matching an
 * exact display ID, email, roll number, or team code and is rate limited.
 */
export const lookupPublicPasses = onRequest({
  region: 'asia-south1', timeoutSeconds: 60, memory: '512MiB', maxInstances: 10,
  secrets: [REGISTRATION_ROLL_CLAIM_SECRET],
}, async (request, response) => {
  if (!configureCors(request, response)) return;
  if (request.method === 'OPTIONS') { response.status(204).send(''); return; }
  if (request.method !== 'POST') { sendJson(response, 405, { error: 'Method not allowed.' }); return; }
  try {
    if (!await rateLimit(request, 'pass-lookup')) {
      sendJson(response, 429, { error: 'Too many pass lookups. Wait a minute and try again.' });
      return;
    }
    const rawQuery = clean(requestObject(request.body).query, 180);
    if (rawQuery.length < 3) {
      sendJson(response, 400, { error: 'Enter at least 3 characters from your registration ID, roll number, email, or team code.' });
      return;
    }
    const email = rawQuery.toLowerCase();
    const roll = rawQuery.toUpperCase();
    const teamCode = normalizeRegistrationTeamCode(rawQuery);
    const db = getFirestore();
    const queries = await Promise.all([
      db.collection('registrations').where('display_id', '==', roll).limit(50).get(),
      db.collection('registrations').where('lookup_email', '==', email).limit(50).get(),
      db.collection('registrations').where('leader_email', '==', email).limit(50).get(),
      db.collection('registrations').where('lookup_roll', '==', roll).limit(50).get(),
      db.collection('registrations').where('leader_roll', '==', roll).limit(50).get(),
      db.collection('registrations').where('lookup_team_code', '==', teamCode).limit(50).get(),
      db.collection('registrations').where('team_code', '==', rawQuery.toUpperCase()).limit(50).get(),
      db.collection('registrationMembers').where('lookup_email', '==', email).limit(50).get(),
      db.collection('registrationMembers').where('email', '==', email).limit(50).get(),
      db.collection('registrationMembers').where('lookup_roll', '==', roll).limit(50).get(),
      db.collection('registrationMembers').where('roll_number', '==', roll).limit(50).get(),
    ]);
    const registrationDocs = new Map<string, FirebaseFirestore.DocumentSnapshot>();
    for (const querySnapshot of queries.slice(0, 7)) {
      for (const document of querySnapshot.docs) registrationDocs.set(document.id, document);
    }
    const parentIds = new Set<string>();
    for (const querySnapshot of queries.slice(7)) {
      for (const member of querySnapshot.docs) {
        const parentId = clean(member.get('registration_id'), 80);
        if (parentId) parentIds.add(parentId);
      }
    }
    const parentRefs = [...parentIds].map(id => db.collection('registrations').doc(id));
    for (let index = 0; index < parentRefs.length; index += 100) {
      for (const document of await db.getAll(...parentRefs.slice(index, index + 100))) {
        if (document.exists) registrationDocs.set(document.id, document);
      }
    }
    const ordered = [...registrationDocs.values()]
      .sort((left, right) => Date.parse(String(right.get('created_at') || '')) - Date.parse(String(left.get('created_at') || '')))
      .slice(0, 50);
    const result = await Promise.all(ordered.map(async document => {
      const row = document.data() as AnyRecord;
      const eventId = clean(row.event_id, 80);
      const [eventSnapshot, ticketSnapshot, memberSnapshot] = await Promise.all([
        db.collection('events').doc(eventId).get(),
        db.collection('tickets').doc(document.id).get(),
        db.collection('registrationMembers').where('registration_id', '==', document.id).limit(20).get(),
      ]);
      const event = eventSnapshot.data() as AnyRecord | undefined;
      const ticket = ticketSnapshot.data() as AnyRecord | undefined;
      const team = clean(row.team_code, 40);
      const teamMembers = memberSnapshot.docs.map(member => member.data());
      const teammatePasses = team && teamMembers.length
        ? await db.collection('registrations').where('event_id', '==', eventId)
          .where('team_code', '==', team).limit(21).get()
        : null;
      const memberPassesByRoll = new Map((teammatePasses?.docs || []).map(memberPass => [
        normalizeRegistrationRoll(memberPass.get('leader_roll')),
        memberPass.data(),
      ]));
      const teammates = teamMembers.map(member => {
        const memberPass = memberPassesByRoll.get(normalizeRegistrationRoll(member.roll_number));
        const memberStatus = clean(memberPass?.payment_status, 40) || 'membership_pending';
        return {
          name: clean(member.name, 120), email: clean(member.email, 180), phone: clean(member.phone, 40),
          college: clean(member.college, 180), rollNumber: clean(member.roll_number, 50),
          registrationStatus: memberStatus,
          qrGenerated: Boolean(memberPass && ['verified', 'not_applicable'].includes(memberStatus)),
          registeredAt: memberPass?.created_at,
        };
      });
      const paymentStatus = clean(row.payment_status, 40) || 'payment_required';
      const unlocked = ['verified', 'not_applicable'].includes(paymentStatus);
      return {
        id: clean(row.display_id, 80),
        userId: clean(row.user_id, 80) || undefined,
        buyerRoll: clean(row.buyer_roll, 50) || undefined,
        eventId,
        eventTitle: clean(row.event_title, 140) || clean(event?.title, 140),
        departmentCode: clean(row.department_code, 30) || clean(event?.department_code, 30),
        teamName: clean(row.team_name, 120) || undefined,
        teamCode: team || undefined,
        leaderName: clean(row.leader_name, 120),
        leaderEmail: clean(row.leader_email, 180),
        leaderPhone: clean(row.leader_phone, 40),
        leaderCollege: clean(row.leader_college, 180),
        leaderRoll: clean(row.leader_roll, 50),
        teammates,
        format: clean(row.format, 30),
        fee: Number(row.fee) || 0,
        source: clean(row.source, 30) || 'online',
        registrationDate: firestoreTimestampText(row.created_at) || new Date().toISOString(),
        paymentStatus,
        paymentMethod: clean(row.payment_method, 40) || undefined,
        razorpayOrderId: clean(row.razorpay_order_id, 100) || undefined,
        razorpayPaymentId: clean(row.razorpay_payment_id, 100) || undefined,
        transactionId: clean(row.transaction_id, 100) || undefined,
        rejectionReason: clean(row.rejection_reason, 500) || undefined,
        verifiedBy: clean(row.verified_by, 120) || undefined,
        verifiedAt: firestoreTimestampText(row.verified_at),
        qrToken: unlocked ? clean(ticket?.qr_token, 200) || '' : '',
        checkedIn: ticket?.checked_in === true,
        checkedInAt: firestoreTimestampText(ticket?.checked_in_at),
        checkedInBy: clean(ticket?.checked_in_by, 120) || undefined,
      };
    }));
    sendJson(response, 200, { success: true, registrations: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to look up passes right now.';
    sendJson(response, 503, { success: false, error: message });
  }
});

export const razorpayWebhook = onRequest({
  region: 'asia-south1', timeoutSeconds: 120, memory: '512MiB', maxInstances: 20,
  secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, REGISTRATION_ROLL_CLAIM_SECRET, BREVO_API_KEY],
}, async (request, response) => {
  if (request.method !== 'POST') { sendJson(response, 405, { error: 'Method not allowed.' }); return; }
  const signature = clean(request.get('x-razorpay-signature'), 128).toLowerCase();
  const rawBody = request.rawBody;
  if (!signature || !Buffer.isBuffer(rawBody)) { sendJson(response, 400, { error: 'Webhook signature or body is missing.' }); return; }
  const expected = createHmac('sha256', RAZORPAY_WEBHOOK_SECRET.value()).update(rawBody).digest('hex');
  if (!signaturesMatch(expected, signature)) { sendJson(response, 400, { error: 'Invalid Razorpay webhook signature.' }); return; }
  let event: AnyRecord;
  try { event = JSON.parse(rawBody.toString('utf8')) as AnyRecord; } catch { sendJson(response, 400, { error: 'Invalid webhook JSON.' }); return; }
  if (event.event !== 'payment.captured') { sendJson(response, 200, { received: true, ignored: true }); return; }
  const payment = requestObject(requestObject(requestObject(event.payload).payment).entity);
  const paymentId = clean(payment.id, 100);
  const orderId = clean(payment.order_id, 100);
  if (!paymentId || !orderId) { sendJson(response, 400, { error: 'Captured payment webhook is missing its payment or order ID.' }); return; }
  try {
    const result = await processCapturedPayment(orderId, paymentId, getFirestore());
    sendJson(response, 200, { received: true, processed: !result.ignored, ignored: Boolean(result.ignored) });
  } catch (error) {
    // A non-2xx response asks Razorpay to retry. Finalization is idempotent.
    sendJson(response, 500, { error: error instanceof Error ? error.message : 'Webhook processing failed; retry is safe.' });
  }
});
