import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { defineSecret } from 'firebase-functions/params';
import { setGlobalOptions } from 'firebase-functions/v2';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { canReadStaffEvent, toStaffEvent } from './eventAccess';
import { normalizeRegistrationRoll, normalizeRegistrationTeamCode, registrationRollClaimId } from './registrationClaims';
export { createFreeRegistrations, createRazorpayOrder, verifyRazorpayPayment, razorpayWebhook, sendRegistrationPassEmail, resendRegistrationPassEmail, lookupPublicPasses } from './paymentFunctions';
export { findPublicTeam } from './teamFunctions';

if (getApps().length === 0) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const isVercel = process.env.VERCEL === '1';
  if (serviceAccountJson) {
    let account: { project_id?: unknown; client_email?: unknown; private_key?: unknown };
    try {
      account = JSON.parse(serviceAccountJson) as typeof account;
    } catch {
      throw new Error('Firebase server credentials are invalid.');
    }
    const projectId = typeof account.project_id === 'string' ? account.project_id : '';
    const clientEmail = typeof account.client_email === 'string' ? account.client_email : '';
    const privateKey = typeof account.private_key === 'string' ? account.private_key : '';
    const expectedProjectId = process.env.FIREBASE_PROJECT_ID?.trim();
    if (isVercel && !expectedProjectId) {
      throw new Error('FIREBASE_PROJECT_ID is required for the Vercel deployment.');
    }
    if (!projectId || !clientEmail || !privateKey || (expectedProjectId && expectedProjectId !== projectId)) {
      throw new Error('Firebase server credentials do not match the configured project.');
    }
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  } else {
    if (isVercel) {
      throw new Error('Firebase server credentials are not configured for this Vercel deployment.');
    }
    initializeApp();
  }
}
// Optional fields (team id, Razorpay ids on free passes, etc.) are often
// undefined. Firestore rejects undefined unless this is enabled, which made
// every individual registration fail. Must run before the first read/write.
getFirestore().settings({ ignoreUndefinedProperties: true });
setGlobalOptions({ region: 'asia-south1', maxInstances: 10 });

const GLOBAL_ROLES = new Set(['super_admin', 'dean_sac', 'connect_club', 'vencorpia']);
const DEPARTMENT_ROLES = new Set(['dept_chief_coordinator', 'dept_coordinator']);
const EVENT_ROLES = new Set(['event_coordinator', 'faculty_coord', 'student_coord']);
const OPERATIONS_ROLES = new Set(['finance_reviewer', 'volunteer_checkin', 'checkin_staff']);
const VALID_ROLES = new Set([
  ...GLOBAL_ROLES,
  ...DEPARTMENT_ROLES,
  ...EVENT_ROLES,
  ...OPERATIONS_ROLES,
]);
const CSE_CLUSTERS = new Set(['CSE-1', 'CSE-2', 'CSE-3']);
const ASSIGNED_EVENT_ROLES = new Set([...EVENT_ROLES, 'volunteer_checkin', 'checkin_staff']);
const EVENT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_STAFF_EVENT_RESULTS = 500;
const REGISTRATION_ROLL_CLAIM_SECRET = defineSecret('REGISTRATION_ROLL_CLAIM_SECRET');
const EVENT_CATEGORIES = new Set(['technical', 'workshop', 'hackathon', 'non-technical', 'gaming', 'departmental']);
const EVENT_FORMATS = new Set(['individual', 'duo', 'team']);
const EVENT_STATUSES = new Set(['open', 'upcoming', 'closed', 'pending_approval']);
const EVENT_EDIT_FIELDS = new Map([
  ['title', 'title'], ['slug', 'slug'], ['tagline', 'tagline'], ['category', 'category'],
  ['format', 'format'], ['minTeamSize', 'min_team_size'], ['maxTeamSize', 'max_team_size'],
  ['fee', 'fee'], ['capacity', 'capacity'], ['deadline', 'deadline'], ['date', 'date_display'],
  ['time', 'time_display'], ['venue', 'venue'], ['description', 'description'], ['rules', 'rules'],
  ['prizes', 'prizes'], ['eligibility', 'eligibility'], ['coordinatorName', 'coordinator_name'],
  ['coordinatorPhone', 'coordinator_phone'], ['coordinatorEmail', 'coordinator_email'],
  ['bannerGradient', 'banner_gradient'], ['paymentInstructions', 'payment_instructions'],
  ['whatsappGroupLink', 'whatsapp_group_link'], ['faqs', 'faqs'],
]);

type RoleRecord = {
  user_id?: unknown;
  username?: unknown;
  full_name?: unknown;
  designation?: unknown;
  role?: unknown;
  department_code?: unknown;
  cluster_code?: unknown;
  email?: unknown;
  phone?: unknown;
  access_boundary?: unknown;
  active?: unknown;
};

function textField(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function canonicalRole(role: string): string {
  return role === 'dept_chief_coordinator' ? 'dept_coordinator' : role;
}

type StaffContext = {
  uid: string;
  db: FirebaseFirestore.Firestore;
  roleRecord: RoleRecord;
  role: string;
  departmentCode?: string;
  clusterCode?: string;
  assignedEventIds: string[];
};

function isFirestoreQuotaError(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  const message = error instanceof Error ? error.message : String(error);
  return code === 8 || code === 'RESOURCE_EXHAUSTED' || /RESOURCE_EXHAUSTED|Quota exceeded/i.test(message);
}

// Emergency staff-access snapshot. Used only when Firestore itself returns a
// quota error, and only for a uid+email pair captured from a successful
// authoritative read. Firestore remains authoritative whenever it is available.
function fallbackStaffContext(
  uid: string,
  email: string | undefined,
  db: FirebaseFirestore.Firestore,
): StaffContext | null {
  const raw = process.env.STAFF_ACCESS_FALLBACK_JSON;
  if (!raw) return null;

  let snapshot: Record<string, { email?: unknown; record?: RoleRecord; assignedEventIds?: unknown }>;
  try {
    snapshot = JSON.parse(raw) as typeof snapshot;
  } catch {
    return null;
  }

  const entry = snapshot[uid];
  if (!entry?.record || entry.record.active !== true) return null;
  const expectedEmail = textField(entry.email);
  if (expectedEmail && email && expectedEmail.toLowerCase() !== email.toLowerCase()) return null;

  const role = textField(entry.record.role)?.toLowerCase();
  if (!role || !VALID_ROLES.has(role)) return null;
  const departmentCode = textField(entry.record.department_code)?.toUpperCase();
  const clusterCode = textField(entry.record.cluster_code)?.toUpperCase();
  if (clusterCode && (departmentCode !== 'CSE' || !CSE_CLUSTERS.has(clusterCode))) return null;
  if ((DEPARTMENT_ROLES.has(role) || EVENT_ROLES.has(role)) && !departmentCode) return null;
  if (DEPARTMENT_ROLES.has(role) && departmentCode === 'CSE' && !clusterCode) return null;

  const assignedEventIds = Array.isArray(entry.assignedEventIds)
    ? entry.assignedEventIds.filter((eventId): eventId is string => typeof eventId === 'string')
    : [];
  return { uid, db, roleRecord: entry.record, role, departmentCode, clusterCode, assignedEventIds };
}

async function loadStaffContext(uid: string, email?: string): Promise<StaffContext> {
  // Callable auth has already verified the Firebase ID token. Keep this read
  // path dependent only on Firestore so sign-in does not require Auth Admin
  // user.get permission from the server credential.
  const db = getFirestore();
  try {
    const roleSnapshot = await db.collection('adminRoles')
      .where('user_id', '==', uid)
      .get();
    const activeRoles = roleSnapshot.docs
      .map(document => document.data() as RoleRecord)
      .filter(record => record.active === true && record.user_id === uid);

    if (activeRoles.length === 0) {
      throw new HttpsError('permission-denied', 'This Firebase account has no active staff role.');
    }
    if (activeRoles.length !== 1) {
      throw new HttpsError('failed-precondition', 'This account has multiple active staff roles and needs administrator review.');
    }

    const roleRecord = activeRoles[0];
    const role = textField(roleRecord.role)?.toLowerCase();
    if (!role || !VALID_ROLES.has(role)) {
      throw new HttpsError('failed-precondition', 'This staff role is not supported.');
    }

    const departmentCode = textField(roleRecord.department_code)?.toUpperCase();
    const clusterCode = textField(roleRecord.cluster_code)?.toUpperCase();
    if (clusterCode && (departmentCode !== 'CSE' || !CSE_CLUSTERS.has(clusterCode))) {
      throw new HttpsError('failed-precondition', 'This staff account has an invalid department cluster assignment.');
    }
    if ((DEPARTMENT_ROLES.has(role) || EVENT_ROLES.has(role)) && !departmentCode) {
      throw new HttpsError('failed-precondition', 'This staff account is missing its department assignment.');
    }
    if (DEPARTMENT_ROLES.has(role) && departmentCode === 'CSE' && !clusterCode) {
      throw new HttpsError('failed-precondition', 'This CSE coordinator account is missing its cluster assignment.');
    }

    const assignmentSnapshot = await db.collection('adminEventAssignments')
      .where('admin_user_id', '==', uid)
      .limit(MAX_STAFF_EVENT_RESULTS + 1)
      .get();
    if (assignmentSnapshot.size > MAX_STAFF_EVENT_RESULTS) {
      throw new HttpsError('failed-precondition', 'This account has too many event assignments and needs administrator review.');
    }
    const assignedEventIds = [...new Set(assignmentSnapshot.docs
      .map(document => textField(document.data().event_id))
      .filter((eventId): eventId is string => Boolean(eventId)))];

    return { uid, db, roleRecord, role, departmentCode, clusterCode, assignedEventIds };
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      const fallback = fallbackStaffContext(uid, email, db);
      if (fallback) return fallback;
    }
    throw error;
  }
}

function staffAccessPayload(context: StaffContext) {
  const { uid, roleRecord, role, departmentCode, clusterCode, assignedEventIds } = context;
  return {
    user: {
      id: uid,
      username: textField(roleRecord.username),
      fullName: textField(roleRecord.full_name) || 'Staff member',
      designation: textField(roleRecord.designation) || 'Staff',
      role: canonicalRole(role),
      departmentCode,
      clusterCode,
      email: textField(roleRecord.email),
      phone: textField(roleRecord.phone),
      accessBoundary: textField(roleRecord.access_boundary),
      assignedEvents: assignedEventIds,
    },
    scope: GLOBAL_ROLES.has(role)
      ? { kind: 'global' as const }
      : ASSIGNED_EVENT_ROLES.has(role)
        ? { kind: 'assigned_events' as const, eventIds: assignedEventIds }
        : OPERATIONS_ROLES.has(role)
          ? { kind: 'central_operations' as const }
          : { kind: 'department' as const, departmentCode, clusterCode },
  };
}

/**
 * Read-only staff identity/scope bootstrap. This is display metadata only:
 * every future operation must re-check the active role and relevant event
 * assignment from Firestore in that operation's own server handler.
 */
export const getStaffAccess = onCall({ enforceAppCheck: false }, async request => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in with an authorized staff account.');
  return staffAccessPayload(await loadStaffContext(uid, request.auth?.token?.email));
});

export const getStaffEvent = onCall({ enforceAppCheck: false }, async request => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in with an authorized staff account.');
  const eventId = textField(request.data?.eventId);
  if (!eventId || !EVENT_ID_PATTERN.test(eventId)) {
    throw new HttpsError('invalid-argument', 'A valid event ID is required.');
  }

  const context = await loadStaffContext(uid, request.auth?.token?.email);
  const eventRef = context.db.collection('events').doc(eventId);
  const eventSnapshot = await eventRef.get();
  if (!eventSnapshot.exists) throw new HttpsError('not-found', 'The event was not found.');
  const event = eventSnapshot.data() as Record<string, unknown>;
  const assigned = new Set(context.assignedEventIds);
  if (!canReadStaffEvent(context.roleRecord, eventId, event, assigned)) {
    throw new HttpsError('permission-denied', 'This account is not authorized for this department, cluster, or event.');
  }
  return { event: toStaffEvent(eventId, event) };
});

export const listStaffEvents = onCall({ enforceAppCheck: false }, async request => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in with an authorized staff account.');

  const context = await loadStaffContext(uid, request.auth?.token?.email);
  const events = context.db.collection('events');
  let snapshots: FirebaseFirestore.DocumentSnapshot[];

  if (DEPARTMENT_ROLES.has(context.role)) {
    snapshots = (await events
      .where('department_code', '==', context.departmentCode)
      .limit(MAX_STAFF_EVENT_RESULTS + 1)
      .get()).docs;
  } else if (ASSIGNED_EVENT_ROLES.has(context.role)) {
    const eventRefs = context.assignedEventIds
      .filter(eventId => EVENT_ID_PATTERN.test(eventId))
      .map(eventId => events.doc(eventId));
    const loaded: FirebaseFirestore.DocumentSnapshot[] = [];
    for (let index = 0; index < eventRefs.length; index += 100) {
      loaded.push(...await context.db.getAll(...eventRefs.slice(index, index + 100)));
    }
    snapshots = loaded;
  } else if (GLOBAL_ROLES.has(context.role) || context.role === 'finance_reviewer') {
    snapshots = (await events.limit(MAX_STAFF_EVENT_RESULTS + 1).get()).docs;
  } else {
    throw new HttpsError('permission-denied', 'This staff role cannot list events.');
  }

  if (snapshots.length > MAX_STAFF_EVENT_RESULTS) {
    throw new HttpsError('resource-exhausted', 'Too many events to return in one request.');
  }

  const assigned = new Set(context.assignedEventIds);
  const result = snapshots
    .filter(snapshot => snapshot.exists)
    .map(snapshot => ({ id: snapshot.id, data: snapshot.data() as Record<string, unknown> }))
    .filter(({ id, data }) => data.is_deleted !== true && !data.deleted_at &&
      canReadStaffEvent(context.roleRecord, id, data, assigned))
    .sort((left, right) => String(left.data.title || '').localeCompare(String(right.data.title || '')))
    .map(({ id, data }) => toStaffEvent(id, data));

  return { events: result };
});

async function readableEventsForStaff(context: StaffContext, requestedIds?: unknown): Promise<Map<string, Record<string, unknown>>> {
  const events = context.db.collection('events');
  let snapshots: FirebaseFirestore.DocumentSnapshot[];
  if (Array.isArray(requestedIds)) {
    if (requestedIds.length < 1 || requestedIds.length > MAX_STAFF_EVENT_RESULTS ||
        requestedIds.some(id => typeof id !== 'string' || !EVENT_ID_PATTERN.test(id))) {
      throw new HttpsError('invalid-argument', 'Select between 1 and 500 valid event IDs.');
    }
    const uniqueIds = [...new Set(requestedIds as string[])];
    const refs = uniqueIds.map(id => events.doc(id));
    snapshots = [];
    for (let index = 0; index < refs.length; index += 100) {
      snapshots.push(...await context.db.getAll(...refs.slice(index, index + 100)));
    }
  } else if (DEPARTMENT_ROLES.has(context.role)) {
    snapshots = (await events.where('department_code', '==', context.departmentCode)
      .limit(MAX_STAFF_EVENT_RESULTS + 1).get()).docs;
  } else if (ASSIGNED_EVENT_ROLES.has(context.role)) {
    const refs = context.assignedEventIds.filter(id => EVENT_ID_PATTERN.test(id)).map(id => events.doc(id));
    snapshots = [];
    for (let index = 0; index < refs.length; index += 100) {
      snapshots.push(...await context.db.getAll(...refs.slice(index, index + 100)));
    }
  } else if (GLOBAL_ROLES.has(context.role) || context.role === 'finance_reviewer') {
    snapshots = (await events.limit(MAX_STAFF_EVENT_RESULTS + 1).get()).docs;
  } else {
    throw new HttpsError('permission-denied', 'This staff role cannot read event registrations.');
  }

  if (snapshots.length > MAX_STAFF_EVENT_RESULTS) {
    throw new HttpsError('resource-exhausted', 'Too many events to return in one request.');
  }
  const assigned = new Set(context.assignedEventIds);
  const result = new Map<string, Record<string, unknown>>();
  for (const snapshot of snapshots) {
    if (!snapshot.exists) continue;
    const event = snapshot.data() as Record<string, unknown>;
    if (canReadStaffEvent(context.roleRecord, snapshot.id, event, assigned)) result.set(snapshot.id, event);
  }
  if (Array.isArray(requestedIds) && result.size !== new Set(requestedIds).size) {
    throw new HttpsError('permission-denied', 'One or more selected events are outside this account’s scope.');
  }
  return result;
}

function firestoreTimestampText(value: unknown): string | undefined {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    const date = value.toDate();
    return date instanceof Date && Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
  }
  return typeof value === 'string' ? value : undefined;
}

function staffRegistrationPayload(
  id: string,
  row: Record<string, unknown>,
  event: Record<string, unknown>,
  ticket?: Record<string, unknown>,
  members: Record<string, unknown>[] = [],
) {
  return {
    id: textField(row.display_id) || id,
    userId: textField(row.user_id),
    buyerRoll: textField(row.buyer_roll),
    eventId: textField(row.event_id) || '',
    eventTitle: textField(row.event_title) || textField(event.title) || '',
    departmentCode: textField(row.department_code) || textField(event.department_code),
    teamName: textField(row.team_name),
    teamCode: textField(row.team_code),
    leaderName: textField(row.leader_name) || '',
    leaderEmail: textField(row.leader_email) || '',
    leaderPhone: textField(row.leader_phone) || '',
    leaderCollege: textField(row.leader_college) || '',
    leaderRoll: textField(row.leader_roll) || '',
    teammates: members.map(member => ({
      name: textField(member.name) || '',
      email: textField(member.email) || '',
      phone: textField(member.phone) || '',
      college: textField(member.college) || '',
      rollNumber: textField(member.roll_number) || '',
    })),
    format: textField(row.format) || 'individual',
    fee: Number(row.fee) || 0,
    source: textField(row.source) || 'online',
    registrationDate: firestoreTimestampText(row.created_at) || new Date().toISOString(),
    paymentStatus: textField(row.payment_status) || 'payment_required',
    paymentMethod: textField(row.payment_method),
    transactionId: textField(row.transaction_id),
    razorpayOrderId: textField(row.razorpay_order_id),
    razorpayPaymentId: textField(row.razorpay_payment_id),
    rejectionReason: textField(row.rejection_reason),
    verifiedBy: textField(row.verified_by),
    verifiedAt: firestoreTimestampText(row.verified_at),
    qrToken: textField(ticket?.qr_token) || '',
    checkedIn: ticket?.checked_in === true,
    checkedInAt: firestoreTimestampText(ticket?.checked_in_at),
    checkedInBy: textField(ticket?.checked_in_by),
  };
}

export const listStaffRegistrations = onCall({ enforceAppCheck: false, timeoutSeconds: 120 }, async request => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in with an authorized staff account.');
  const context = await loadStaffContext(uid, request.auth?.token?.email);
  const eventMap = await readableEventsForStaff(context, request.data?.eventIds);
  const eventIds = [...eventMap.keys()];
  if (eventIds.length === 0) return { registrations: [] };

  const registrations: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  for (let index = 0; index < eventIds.length; index += 30) {
    const snapshot = await context.db.collection('registrations')
      .where('event_id', 'in', eventIds.slice(index, index + 30)).limit(2501 - registrations.length).get();
    registrations.push(...snapshot.docs);
    if (registrations.length > 2500) {
      throw new HttpsError('resource-exhausted', 'This registration list is too large for one request. Filter to fewer events.');
    }
  }
  registrations.sort((left, right) => {
    const leftDate = Date.parse(firestoreTimestampText(left.get('created_at')) || '') || 0;
    const rightDate = Date.parse(firestoreTimestampText(right.get('created_at')) || '') || 0;
    return rightDate - leftDate;
  });
  const registrationIds = registrations.map(document => document.id);
  const tickets = new Map<string, Record<string, unknown>>();
  const members = new Map<string, Record<string, unknown>[]>();
  for (let index = 0; index < registrationIds.length; index += 30) {
    const ids = registrationIds.slice(index, index + 30);
    const [ticketSnapshot, memberSnapshot] = await Promise.all([
      context.db.collection('tickets').where('registration_id', 'in', ids).get(),
      context.db.collection('registrationMembers').where('registration_id', 'in', ids).get(),
    ]);
    for (const document of ticketSnapshot.docs) {
      tickets.set(textField(document.get('registration_id')) || document.id, document.data());
    }
    for (const document of memberSnapshot.docs) {
      const member = document.data();
      const registrationId = textField(member.registration_id);
      if (registrationId) members.set(registrationId, [...(members.get(registrationId) || []), member]);
    }
  }
  return {
    registrations: registrations.map(document => staffRegistrationPayload(
      document.id,
      document.data(),
      eventMap.get(textField(document.get('event_id')) || '') || {},
      tickets.get(document.id),
      members.get(document.id) || [],
    )),
  };
});

export const listStaffTeams = onCall({ enforceAppCheck: false, timeoutSeconds: 120 }, async request => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in with an authorized staff account.');
  const context = await loadStaffContext(uid, request.auth?.token?.email);
  const eventMap = await readableEventsForStaff(context, request.data?.eventIds);
  const eventIds = [...eventMap.keys()];
  if (eventIds.length === 0) return { teams: [] };
  const documents: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  for (let index = 0; index < eventIds.length; index += 30) {
    const snapshot = await context.db.collection('teams')
      .where('event_id', 'in', eventIds.slice(index, index + 30))
      .limit(1001 - documents.length)
      .get();
    documents.push(...snapshot.docs);
    if (documents.length > 1000) {
      throw new HttpsError('resource-exhausted', 'This team list is too large for one request. Filter to fewer events.');
    }
  }
  documents.sort((left, right) =>
    (Date.parse(firestoreTimestampText(right.get('updated_at')) || right.get('created_at')) || 0) -
    (Date.parse(firestoreTimestampText(left.get('updated_at')) || left.get('created_at')) || 0));
  return {
    teams: documents.map(document => {
      const row = document.data();
      return {
        id: document.id,
        team_code: textField(row.team_code) || '',
        team_name: textField(row.team_name) || '',
        event_id: textField(row.event_id) || '',
        event_title: textField(row.event_title) || '',
        registration_id: textField(row.registration_id) || '',
        leader_id: textField(row.leader_id) || undefined,
        leader_name: textField(row.leader_name) || '',
        leader_roll: textField(row.leader_roll) || '',
        leader_email: textField(row.leader_email) || '',
        leader_phone: textField(row.leader_phone) || '',
        leader_college: textField(row.leader_college) || '',
        members: Array.isArray(row.members) ? row.members : [],
        max_team_size: Number(row.max_team_size) || 1,
        min_team_size: Number(row.min_team_size) || 1,
        created_at: firestoreTimestampText(row.created_at) || '',
        updated_at: firestoreTimestampText(row.updated_at) || undefined,
      };
    }),
  };
});

/** Staff-recorded spot sales are written server-side so pass IDs, QR claims,
 * event capacity, and roll-number uniqueness stay consistent with online sales. */
export const createStaffSpotRegistration = onCall({
  enforceAppCheck: false,
  secrets: [REGISTRATION_ROLL_CLAIM_SECRET],
}, async request => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in with an authorized staff account.');
  const context = await loadStaffContext(uid, request.auth?.token?.email);
  if (!GLOBAL_ROLES.has(context.role) && !DEPARTMENT_ROLES.has(context.role) && !EVENT_ROLES.has(context.role)) {
    throw new HttpsError('permission-denied', 'This staff role cannot create spot registrations.');
  }
  const input = request.data?.registration;
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpsError('invalid-argument', 'Spot registration details are required.');
  const raw = input as Record<string, unknown>;
  const eventId = requiredText(raw.eventId, 'Event ID', 80);
  if (!EVENT_ID_PATTERN.test(eventId)) throw new HttpsError('invalid-argument', 'The selected event ID is invalid.');
  const eventRef = context.db.collection('events').doc(eventId);
  const eventSnapshot = await eventRef.get();
  if (!eventSnapshot.exists) throw new HttpsError('not-found', 'The selected event was not found.');
  const event = eventSnapshot.data() as Record<string, unknown>;
  if (!canReadStaffEvent(context.roleRecord, eventId, event, new Set(context.assignedEventIds))) {
    throw new HttpsError('permission-denied', 'This event is outside your department or assigned-event scope.');
  }
  const eventDeadline = event.deadline && typeof event.deadline === 'string' ? Date.parse(event.deadline) : NaN;
  if (event.is_deleted === true || event.deleted_at || event.approval_status !== 'approved' || !['open', 'upcoming'].includes(String(event.status)) ||
      (Number.isFinite(eventDeadline) && eventDeadline < Date.now())) {
    throw new HttpsError('failed-precondition', 'This event is not accepting spot registrations.');
  }
  const format = textField(raw.format) || textField(event.format) || 'individual';
  if (format !== event.format || !EVENT_FORMATS.has(format)) throw new HttpsError('failed-precondition', 'The registration format no longer matches this event.');
  const fee = Number(event.fee);
  if (!Number.isSafeInteger(fee) || fee < 0 || fee > 1_000_000) throw new HttpsError('failed-precondition', 'This event has an invalid registration fee.');
  const leader = {
    name: requiredText(raw.leaderName, 'Participant name', 120),
    email: textField(raw.leaderEmail)?.toLowerCase() || '',
    phone: textField(raw.leaderPhone) || '',
    college: textField(raw.leaderCollege) || '',
    roll: normalizeRegistrationRoll(raw.leaderRoll).slice(0, 50),
  };
  if (!leader.roll) throw new HttpsError('invalid-argument', 'Participant roll number is required.');
  const rawMembers = Array.isArray(raw.teammates) ? raw.teammates : [];
  if (rawMembers.length > 19) throw new HttpsError('invalid-argument', 'A team can contain at most 20 participants.');
  const members = rawMembers.map((value, index) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpsError('invalid-argument', `Team member ${index + 1} has invalid details.`);
    const member = value as Record<string, unknown>;
    const name = requiredText(member.name, `Team member ${index + 1} name`, 120);
    const rollNumber = normalizeRegistrationRoll(member.rollNumber ?? member.roll_number).slice(0, 50);
    if (!rollNumber) throw new HttpsError('invalid-argument', `Team member ${index + 1} roll number is required.`);
    return {
      name,
      email: textField(member.email)?.toLowerCase() || '',
      phone: textField(member.phone) || '',
      college: textField(member.college) || '',
      rollNumber,
      deptSection: textField(member.deptSection ?? member.dept_section)?.toUpperCase() || '',
    };
  });
  const participantCount = 1 + members.length;
  if (format === 'individual' && members.length) throw new HttpsError('invalid-argument', 'Individual registrations cannot include teammates.');
  if (format !== 'individual' && (participantCount < Number(event.min_team_size || 1) || participantCount > Number(event.max_team_size || 1))) {
    throw new HttpsError('failed-precondition', `Team size must be between ${event.min_team_size} and ${event.max_team_size} members.`);
  }
  const rolls = [leader.roll, ...members.map(member => member.rollNumber)];
  if (new Set(rolls).size !== rolls.length) throw new HttpsError('invalid-argument', 'The participant and team member roll numbers must be unique.');
  const paymentStatus = fee === 0 ? 'not_applicable' : textField(raw.paymentStatus) || 'verification_pending';
  if (fee > 0 && !['verified', 'verification_pending'].includes(paymentStatus)) throw new HttpsError('invalid-argument', 'Choose a valid spot-payment status.');
  const paymentMethod = fee === 0 ? 'none' : textField(raw.paymentMethod) || 'spot';
  const transactionId = fee === 0 ? '' : textField(raw.transactionId) || '';
  const staffAttribution = textField(raw.spotRegisteredBy)
    || textField(context.roleRecord.full_name)
    || textField(context.roleRecord.email)
    || 'Authorized staff';
  const teamName = format === 'individual' ? '' : textField(raw.teamName) || `${leader.name}'s Team`;
  if (format !== 'individual' && !teamName) throw new HttpsError('invalid-argument', 'Team name is required.');
  const teamCode = format === 'individual' ? '' : (textField(raw.teamCode)?.toUpperCase() || `FX-SPOT-${randomUUID().slice(0, 8).toUpperCase()}`);
  const normalizedTeamCode = normalizeRegistrationTeamCode(teamCode);
  const claimSecret = REGISTRATION_ROLL_CLAIM_SECRET.value();
  const claimRefs = rolls.map(roll => context.db.collection('registrationRollClaims').doc(registrationRollClaimId(eventId, roll, claimSecret)));
  const registrationIds = rolls.map(() => randomUUID());
  const displayIds = rolls.map(() => `FEST-2026-${randomBytes(5).toString('hex').toUpperCase()}`);
  const qrTokens = displayIds.map(id => `FEST26-${randomBytes(5).toString('hex').slice(0, 7).toUpperCase()}-${id.slice(-4)}`);
  const displayRefs = displayIds.map(id => context.db.collection('registrationDisplayClaims').doc(id));
  const ticketClaimRefs = qrTokens.map(token => context.db.collection('ticketTokenClaims').doc(createHash('sha256').update(token).digest('hex')));
  const teamRef = format === 'individual' ? null : context.db.collection('teams').doc(randomUUID());
  const teamCodeClaimRef = teamRef ? context.db.collection('teamCodeClaims').doc(normalizedTeamCode) : null;
  const teamCodeLookup = teamRef ? context.db.collection('teams').where('lookup_team_code', '==', normalizedTeamCode).limit(2) : null;
  const legacyTeamCodeLookup = teamRef ? context.db.collection('teams').where('team_code', '==', teamCode).limit(2) : null;
  const now = new Date().toISOString();
  const result = await context.db.runTransaction(async transaction => {
    const [freshEvent, claimSnapshots, displaySnapshots, tokenSnapshots, teamCodeClaim, matchingTeams, matchingLegacyTeams] = await Promise.all([
      transaction.get(eventRef),
      Promise.all(claimRefs.map(ref => transaction.get(ref))),
      Promise.all(displayRefs.map(ref => transaction.get(ref))),
      Promise.all(ticketClaimRefs.map(ref => transaction.get(ref))),
      teamCodeClaimRef ? transaction.get(teamCodeClaimRef) : Promise.resolve(null),
      teamCodeLookup ? transaction.get(teamCodeLookup) : Promise.resolve(null),
      legacyTeamCodeLookup ? transaction.get(legacyTeamCodeLookup) : Promise.resolve(null),
    ]);
    if (!freshEvent.exists) throw new HttpsError('not-found', 'The selected event was not found.');
    const fresh = freshEvent.data() as Record<string, unknown>;
    if (!canReadStaffEvent(context.roleRecord, eventId, fresh, new Set(context.assignedEventIds))) {
      throw new HttpsError('permission-denied', 'This event is outside your department or assigned-event scope.');
    }
    const freshDeadline = Date.parse(firestoreTimestampText(fresh.deadline) || '');
    if (fresh.approval_status !== 'approved' || fresh.is_deleted === true || fresh.deleted_at || !['open', 'upcoming'].includes(String(fresh.status)) ||
        (Number.isFinite(freshDeadline) && freshDeadline < Date.now())) {
      throw new HttpsError('failed-precondition', 'This event is no longer accepting spot registrations.');
    }
    if (String(fresh.format) !== format || Number(fresh.fee) !== fee) throw new HttpsError('failed-precondition', 'Event registration rules changed. Refresh and retry.');
    if (claimSnapshots.some(snapshot => snapshot.exists && (snapshot.get('conflict') === true || snapshot.get('pending_team_membership') === true))) {
      throw new HttpsError('already-exists', 'A participant is already reserved for another team in this event.');
    }
    const priorRegistrationIds = [...new Set(claimSnapshots.flatMap(snapshot => {
      const ids = snapshot.get('registration_ids');
      return Array.isArray(ids) ? ids.map(String) : [];
    }))];
    if (priorRegistrationIds.length > 100) throw new HttpsError('failed-precondition', 'A participant has too many existing pass records. Ask an administrator to review them.');
    const priorSnapshots = await Promise.all(priorRegistrationIds.map(id => transaction.get(context.db.collection('registrations').doc(id))));
    if (priorSnapshots.some(snapshot => snapshot.exists && snapshot.get('payment_status') !== 'rejected')) {
      throw new HttpsError('already-exists', 'A participant is already registered for this event.');
    }
    if (displaySnapshots.some(snapshot => snapshot.exists) || tokenSnapshots.some(snapshot => snapshot.exists)) {
      throw new HttpsError('aborted', 'Unique pass identifiers could not be allocated. Retry the registration.');
    }
    const existingTeamIds = new Set([...(matchingTeams?.docs || []), ...(matchingLegacyTeams?.docs || [])].map(document => document.id));
    if (teamCodeClaim?.exists || existingTeamIds.size > 0) throw new HttpsError('already-exists', 'That team code is already in use. Generate another code.');
    const eventTitle = textField(fresh.title) || 'FESTRONIX event';
    const status = fee === 0 ? 'not_applicable' : paymentStatus;
    const participantRows = [{ ...leader, isLeader: true }, ...members.map(member => ({
      name: member.name, email: member.email, phone: member.phone, college: member.college,
      roll: member.rollNumber, isLeader: false,
    }))];
    for (let index = 0; index < participantRows.length; index += 1) {
      const person = participantRows[index];
      const id = registrationIds[index];
      const data = {
        id,
        display_id: displayIds[index],
        user_id: null,
        buyer_roll: leader.roll,
        event_id: eventId,
        event_title: eventTitle,
        leader_name: person.name,
        leader_email: person.email,
        lookup_email: person.email.toLowerCase(),
        leader_phone: person.phone,
        leader_college: person.college,
        leader_roll: person.roll,
        lookup_roll: person.roll,
        format,
        fee: person.isLeader ? fee : 0,
        source: 'spot',
        payment_status: status,
        payment_method: paymentMethod,
        transaction_id: transactionId || null,
        payment_screenshot_url: null,
        rejection_reason: null,
        verified_by: status === 'verified' || status === 'not_applicable' ? staffAttribution : null,
        verified_at: status === 'verified' || status === 'not_applicable' ? now : null,
        spot_registered_by: staffAttribution,
        team_name: teamName || null,
        team_code: teamCode || null,
        lookup_team_code: normalizedTeamCode || null,
        department_code: textField(fresh.department_code)?.toUpperCase() || '',
        checked_in: false,
        razorpay_order_id: null,
        razorpay_payment_id: null,
        created_at: now,
        updated_at: now,
      };
      const registrationRef = context.db.collection('registrations').doc(id);
      const ticketRef = context.db.collection('tickets').doc(id);
      transaction.create(registrationRef, data);
      transaction.create(ticketRef, { id, registration_id: id, qr_token: qrTokens[index], checked_in: false, checked_in_at: null, checked_in_by: null, created_at: now });
      transaction.create(displayRefs[index], { registration_id: id, created_at: now });
      transaction.create(ticketClaimRefs[index], { registration_id: id, created_at: now });
      const oldIds = claimSnapshots[index].exists && Array.isArray(claimSnapshots[index].get('registration_ids'))
        ? (claimSnapshots[index].get('registration_ids') as unknown[]).map(String).filter(existingId => !priorSnapshots.some(snapshot => snapshot.id === existingId && snapshot.get('payment_status') === 'rejected'))
        : [];
      transaction.set(claimRefs[index], {
        event_id: eventId,
        roll_hash: claimRefs[index].id.slice(eventId.length + 2),
        registration_ids: [...new Set([...oldIds, registrationIds[0], id])].sort(),
        team_codes: normalizedTeamCode ? [normalizedTeamCode] : [],
        conflict: false,
        updated_at: now,
      });
    }
    for (let index = 0; index < members.length; index += 1) {
      const member = members[index];
      const memberRef = context.db.collection('registrationMembers').doc(`${registrationIds[0]}__${registrationIds[index + 1]}`);
      transaction.create(memberRef, {
        id: memberRef.id,
        registration_id: registrationIds[0],
        name: member.name,
        email: member.email,
        lookup_email: member.email.toLowerCase(),
        phone: member.phone,
        college: member.college,
        roll_number: member.rollNumber,
        lookup_roll: member.rollNumber,
        created_at: now,
      });
    }
    if (teamRef && teamCodeClaimRef) {
      transaction.create(teamRef, {
        id: teamRef.id,
        team_code: teamCode,
        lookup_team_code: normalizedTeamCode,
        team_name: teamName,
        event_id: eventId,
        event_title: eventTitle,
        registration_id: displayIds[0],
        leader_id: null,
        leader_name: leader.name,
        leader_roll: leader.roll,
        leader_email: leader.email,
        leader_phone: leader.phone,
        leader_college: leader.college,
        members,
        member_count: members.length,
        max_team_size: Number(fresh.max_team_size) || 1,
        min_team_size: Number(fresh.min_team_size) || 1,
        created_at: now,
        updated_at: now,
      });
      transaction.create(teamCodeClaimRef, { team_id: teamRef.id, event_id: eventId, created_at: now });
    }
    const registeredCount = Number(fresh.registered_count || 0) + participantCount;
    transaction.update(eventRef, { registered_count: registeredCount, updated_at: now });
    const projectionRef = context.db.collection('publicEvents').doc(eventId);
    transaction.set(projectionRef, { registeredCount }, { merge: true });
    return { registrationId: registrationIds[0], status };
  });
  const [registrationSnapshot, ticketSnapshot, memberSnapshot] = await Promise.all([
    context.db.collection('registrations').doc(result.registrationId).get(),
    context.db.collection('tickets').doc(result.registrationId).get(),
    context.db.collection('registrationMembers').where('registration_id', '==', result.registrationId).limit(20).get(),
  ]);
  return {
    registration: staffRegistrationPayload(
      result.registrationId,
      registrationSnapshot.data() as Record<string, unknown>,
      event,
      ticketSnapshot.data(),
      memberSnapshot.docs.map(document => document.data()),
    ),
  };
});

async function resolveStaffRegistration(context: StaffContext, query: string) {
  const cleanQuery = query.trim();
  if (!cleanQuery) throw new HttpsError('invalid-argument', 'Enter a pass ID or QR token.');
  const db = context.db;
  let registration: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot | undefined;
  if (EVENT_ID_PATTERN.test(cleanQuery)) {
    const snapshot = await db.collection('registrations').doc(cleanQuery).get();
    if (snapshot.exists) registration = snapshot;
  }
  if (!registration) {
    const [display, ticket] = await Promise.all([
      db.collection('registrations').where('display_id', '==', cleanQuery.toUpperCase()).limit(2).get(),
      db.collection('tickets').where('qr_token', '==', cleanQuery).limit(2).get(),
    ]);
    const matches = new Map<string, FirebaseFirestore.DocumentSnapshot>();
    for (const document of display.docs) matches.set(document.id, await db.collection('registrations').doc(document.id).get());
    for (const document of ticket.docs) {
      const registrationId = textField(document.get('registration_id'));
      if (registrationId) matches.set(registrationId, await db.collection('registrations').doc(registrationId).get());
    }
    if (matches.size > 1) throw new HttpsError('failed-precondition', 'The supplied pass identifier is ambiguous.');
    registration = [...matches.values()].find(document => document.exists);
  }
  return registration;
}

export const reviewStaffRegistrationPayment = onCall({ enforceAppCheck: false }, async request => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in with an authorized staff account.');
  const registrationId = requiredText(request.data?.registrationId, 'Registration ID or QR token', 200);
  const status = textField(request.data?.status);
  if (status !== 'verified' && status !== 'rejected') {
    throw new HttpsError('invalid-argument', 'Payment review status must be verified or rejected.');
  }
  const reason = textField(request.data?.rejectionReason)?.slice(0, 500);
  if (status === 'rejected' && !reason) throw new HttpsError('invalid-argument', 'Provide a reason when rejecting a payment.');
  const context = await loadStaffContext(uid, request.auth?.token?.email);
  if (!GLOBAL_ROLES.has(context.role) && context.role !== 'finance_reviewer' &&
      !DEPARTMENT_ROLES.has(context.role) && !EVENT_ROLES.has(context.role)) {
    throw new HttpsError('permission-denied', 'This staff role cannot review payment records.');
  }
  const registrationSnapshot = await resolveStaffRegistration(context, registrationId);
  if (!registrationSnapshot?.exists) throw new HttpsError('not-found', 'Registration was not found.');
  const initial = registrationSnapshot.data() as Record<string, unknown>;
  const eventId = textField(initial.event_id) || '';
  const eventRef = context.db.collection('events').doc(eventId);
  const eventSnapshot = await eventRef.get();
  const event = eventSnapshot.data() as Record<string, unknown> | undefined;
  if (!event || (!GLOBAL_ROLES.has(context.role) && context.role !== 'finance_reviewer' &&
      !canReadStaffEvent(context.roleRecord, eventId, event, new Set(context.assignedEventIds)))) {
    throw new HttpsError('permission-denied', 'This registration is outside your staff scope.');
  }
  const paymentMethod = textField(initial.payment_method)?.toLowerCase();
  if (paymentMethod === 'razorpay' || initial.razorpay_order_id || initial.razorpay_payment_id) {
    throw new HttpsError('failed-precondition', 'Razorpay payments are verified automatically and cannot be changed manually.');
  }
  const registrationRef = registrationSnapshot.ref;
  const auditRef = context.db.collection('auditLogs').doc(randomUUID());
  const now = new Date().toISOString();
  await context.db.runTransaction(async transaction => {
    const [liveRegistration, liveEvent] = await Promise.all([
      transaction.get(registrationRef),
      transaction.get(eventRef),
    ]);
    if (!liveRegistration.exists || !liveEvent.exists) throw new HttpsError('not-found', 'Registration or event was not found.');
    const current = liveRegistration.data() as Record<string, unknown>;
    const currentEvent = liveEvent.data() as Record<string, unknown>;
    if (!GLOBAL_ROLES.has(context.role) && context.role !== 'finance_reviewer' &&
        !canReadStaffEvent(context.roleRecord, eventId, currentEvent, new Set(context.assignedEventIds))) {
      throw new HttpsError('permission-denied', 'This registration is outside your staff scope.');
    }
    if (textField(current.payment_method)?.toLowerCase() === 'razorpay' || current.razorpay_order_id || current.razorpay_payment_id) {
      throw new HttpsError('failed-precondition', 'Razorpay payments are verified automatically and cannot be changed manually.');
    }
    if (textField(current.payment_status) !== 'verification_pending') {
      throw new HttpsError('failed-precondition', 'Only payments awaiting manual verification can be reviewed.');
    }
    const actorName = textField(context.roleRecord.full_name) || 'Staff reviewer';
    transaction.update(registrationRef, {
      payment_status: status,
      verified_by: actorName,
      verified_at: now,
      rejection_reason: status === 'rejected' ? reason : null,
      updated_at: now,
    });
    transaction.create(auditRef, {
      action: 'registration_payment_reviewed',
      actor_uid: uid,
      actor_role: context.role,
      registration_id: registrationRef.id,
      event_id: eventId,
      previous_status: 'verification_pending',
      next_status: status,
      reason: status === 'rejected' ? reason : null,
      created_at: now,
    });
  });
  return {
    success: true,
    verifiedBy: textField(context.roleRecord.full_name) || 'Staff reviewer',
    verifiedAt: now,
  };
});

export const listStaffRazorpayRefundOrders = onCall({ enforceAppCheck: false }, async request => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in with an authorized staff account.');
  const context = await loadStaffContext(uid, request.auth?.token?.email);
  if (!GLOBAL_ROLES.has(context.role) && context.role !== 'finance_reviewer') {
    throw new HttpsError('permission-denied', 'Only finance reviewers and central administrators can view refund records.');
  }
  const snapshot = await context.db.collection('paymentOrders')
    .where('refund_status', 'in', ['pending', 'failed', 'succeeded'])
    .orderBy('updated_at', 'desc')
    .limit(500)
    .get();
  const orders = snapshot.docs.map(document => {
    const row = document.data() as Record<string, unknown>;
    const payload = row.payload && typeof row.payload === 'object' ? row.payload as Record<string, unknown> : {};
    const items = Array.isArray(payload.items) ? payload.items as Array<Record<string, unknown>> : [];
    const first = items[0] || {};
    return {
      orderId: textField(row.razorpay_order_id) || document.id,
      paymentId: textField(row.refund_payment_id) || textField(row.razorpay_payment_id) || undefined,
      eventId: textField(row.event_id) || textField(first.eventId) || '',
      eventTitle: textField(first.eventTitle) || textField(row.event_title) || 'Multiple events',
      departmentCode: textField(first.departmentCode) || undefined,
      amountPaise: Number(row.amount_paise) || 0,
      orderStatus: textField(row.status) || 'unknown',
      refundStatus: textField(row.refund_status) || 'not_requested',
      refundId: textField(row.refund_id) || undefined,
      refundError: textField(row.refund_error) || undefined,
      lastError: textField(row.last_error) || undefined,
      createdAt: firestoreTimestampText(row.created_at) || '',
      updatedAt: firestoreTimestampText(row.updated_at) || '',
    };
  });
  return { orders };
});

export const checkInStaffRegistration = onCall({ enforceAppCheck: false }, async request => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in with an authorized staff account.');
  const query = requiredText(request.data?.query, 'Pass ID or QR token', 200);
  const staffName = textField(request.data?.staffName) || 'Check-in staff';
  const context = await loadStaffContext(uid, request.auth?.token?.email);
  if (!GLOBAL_ROLES.has(context.role) && !DEPARTMENT_ROLES.has(context.role) &&
      !EVENT_ROLES.has(context.role) && !['volunteer_checkin', 'checkin_staff'].includes(context.role)) {
    throw new HttpsError('permission-denied', 'This staff role cannot check in participants.');
  }
  const registrationSnapshot = await resolveStaffRegistration(context, query);
  if (!registrationSnapshot?.exists) return { success: false, status: 'NOT_FOUND', message: 'No registration was found for this pass.' };
  const registration = registrationSnapshot.data() as Record<string, unknown>;
  const eventId = textField(registration.event_id) || '';
  const eventSnapshot = await context.db.collection('events').doc(eventId).get();
  const event = eventSnapshot.data() as Record<string, unknown> | undefined;
  if (!event || !canReadStaffEvent(context.roleRecord, eventId, event, new Set(context.assignedEventIds))) {
    throw new HttpsError('permission-denied', 'This pass is outside your assigned event scope.');
  }
  const status = textField(registration.payment_status) || 'payment_required';
  if (!['verified', 'not_applicable'].includes(status)) {
    return { success: false, status: 'PAYMENT_PENDING', message: `Entry blocked: payment is ${status.replaceAll('_', ' ').toUpperCase()}.` };
  }
  const ticketRef = context.db.collection('tickets').doc(registrationSnapshot.id);
  const now = new Date().toISOString();
  const result = await context.db.runTransaction(async transaction => {
    const ticketSnapshot = await transaction.get(ticketRef);
    if (!ticketSnapshot.exists) throw new HttpsError('not-found', 'This registration has no valid entry ticket.');
    if (ticketSnapshot.get('checked_in') === true) {
      return { success: false, status: 'ALREADY_CHECKED_IN' as const, checkedInAt: firestoreTimestampText(ticketSnapshot.get('checked_in_at')), checkedInBy: textField(ticketSnapshot.get('checked_in_by')) };
    }
    transaction.update(ticketRef, { checked_in: true, checked_in_at: now, checked_in_by: staffName });
    transaction.update(registrationSnapshot.ref, { checked_in: true, updated_at: now });
    return { success: true, status: 'VALID' as const, checkedInAt: now, checkedInBy: staffName };
  });
  return {
    ...result,
    message: result.success ? `Access granted. Welcome ${textField(registration.leader_name) || 'participant'} (${textField(event.title) || 'event'}).`
      : `Already checked in${result.checkedInAt ? ` at ${result.checkedInAt}` : ''}${result.checkedInBy ? ` by ${result.checkedInBy}` : ''}.`,
    registration: staffRegistrationPayload(registrationSnapshot.id, registration, event, {
      qr_token: (await ticketRef.get()).get('qr_token'), checked_in: true, checked_in_at: result.checkedInAt, checked_in_by: result.checkedInBy,
    }),
  };
});

export const toggleStaffCheckIn = onCall({ enforceAppCheck: false }, async request => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in with an authorized staff account.');
  const query = requiredText(request.data?.query, 'Pass ID or QR token', 200);
  const staffName = textField(request.data?.staffName) || 'Check-in staff';
  const context = await loadStaffContext(uid, request.auth?.token?.email);
  if (!GLOBAL_ROLES.has(context.role) && !DEPARTMENT_ROLES.has(context.role) &&
      !EVENT_ROLES.has(context.role) && !['volunteer_checkin', 'checkin_staff'].includes(context.role)) {
    throw new HttpsError('permission-denied', 'This staff role cannot change participant check-in.');
  }
  const registrationSnapshot = await resolveStaffRegistration(context, query);
  if (!registrationSnapshot?.exists) throw new HttpsError('not-found', 'Registration was not found.');
  const registration = registrationSnapshot.data() as Record<string, unknown>;
  const eventId = textField(registration.event_id) || '';
  const eventSnapshot = await context.db.collection('events').doc(eventId).get();
  const event = eventSnapshot.data() as Record<string, unknown> | undefined;
  if (!event || !canReadStaffEvent(context.roleRecord, eventId, event, new Set(context.assignedEventIds))) {
    throw new HttpsError('permission-denied', 'This pass is outside your assigned event scope.');
  }
  if (!['verified', 'not_applicable'].includes(textField(registration.payment_status) || '')) {
    throw new HttpsError('failed-precondition', 'Payment must be verified before check-in can be changed.');
  }
  const ticketRef = context.db.collection('tickets').doc(registrationSnapshot.id);
  const now = new Date().toISOString();
  const checkedIn = await context.db.runTransaction(async transaction => {
    const ticketSnapshot = await transaction.get(ticketRef);
    if (!ticketSnapshot.exists) throw new HttpsError('not-found', 'This registration has no valid entry ticket.');
    const next = ticketSnapshot.get('checked_in') !== true;
    transaction.update(ticketRef, { checked_in: next, checked_in_at: next ? now : null, checked_in_by: next ? staffName : null });
    transaction.update(registrationSnapshot.ref, { checked_in: next, updated_at: now });
    return next;
  });
  return { success: true, checkedIn };
});

function canManageStaffRole(context: StaffContext, targetRole: string, departmentCode?: string, clusterCode?: string): boolean {
  if (GLOBAL_ROLES.has(context.role)) return true;
  return DEPARTMENT_ROLES.has(context.role) && EVENT_ROLES.has(targetRole) &&
    departmentCode === context.departmentCode &&
    (!context.clusterCode || clusterCode === context.clusterCode);
}

function requiredAdminRole(value: unknown): string {
  const role = textField(value)?.toLowerCase();
  if (!role || !VALID_ROLES.has(role)) throw new HttpsError('invalid-argument', 'Choose a supported staff role.');
  return role;
}

async function resolveManagedAssignments(
  context: StaffContext,
  targetRole: string,
  departmentCode: string | undefined,
  clusterCode: string | undefined,
  rawIds: unknown,
): Promise<string[]> {
  const ids = Array.isArray(rawIds) ? [...new Set(rawIds.map(id => String(id).trim()).filter(Boolean))] : [];
  if (ids.length > 200 || ids.some(id => !EVENT_ID_PATTERN.test(id))) {
    throw new HttpsError('invalid-argument', 'Choose up to 200 valid event assignments.');
  }
  if (!ASSIGNED_EVENT_ROLES.has(targetRole) && ids.length) {
    throw new HttpsError('invalid-argument', 'Event assignments are only valid for event-scoped roles.');
  }
  if (!ids.length) return [];
  if (!canManageStaffRole(context, targetRole, departmentCode, clusterCode)) {
    throw new HttpsError('permission-denied', 'You cannot assign this staff role or department scope.');
  }
  const refs = ids.map(id => context.db.collection('events').doc(id));
  const snapshots: FirebaseFirestore.DocumentSnapshot[] = [];
  for (let index = 0; index < refs.length; index += 100) snapshots.push(...await context.db.getAll(...refs.slice(index, index + 100)));
  const assigned = new Set(context.assignedEventIds);
  for (let index = 0; index < snapshots.length; index += 1) {
    const snapshot = snapshots[index];
    const event = snapshot.data() as Record<string, unknown> | undefined;
    if (!event || !canReadStaffEvent(context.roleRecord, snapshot.id, event, assigned)) {
      throw new HttpsError('permission-denied', 'One or more selected events are outside your staff scope.');
    }
    const eventDepartment = textField(event.department_code)?.toUpperCase();
    const eventCluster = textField(event.cluster_code)?.toUpperCase();
    if (departmentCode !== eventDepartment || (clusterCode && clusterCode !== eventCluster)) {
      throw new HttpsError('invalid-argument', 'Every assigned event must match the staff member’s department and cluster.');
    }
  }
  return ids;
}

function managedAdminPayload(
  uid: string,
  authUser: { email?: string; displayName?: string } | null,
  role: RoleRecord,
  assignedEvents: string[],
) {
  return {
    id: uid,
    username: textField(role.username) || authUser?.email?.split('@')[0] || uid,
    fullName: textField(role.full_name) || authUser?.displayName || 'Staff member',
    designation: textField(role.designation) || 'Staff',
    role: canonicalRole(textField(role.role) || 'event_coordinator'),
    departmentCode: textField(role.department_code)?.toUpperCase(),
    clusterCode: textField(role.cluster_code)?.toUpperCase(),
    email: textField(role.email) || authUser?.email || '',
    phone: textField(role.phone),
    accessBoundary: textField(role.access_boundary),
    assignedEvents,
  };
}

async function assertUniqueStaffUsername(db: FirebaseFirestore.Firestore, username: string, exceptUid?: string): Promise<void> {
  const normalized = username.trim().toLowerCase();
  const activeRoles = await db.collection('adminRoles').where('active', '==', true).limit(2001).get();
  if (activeRoles.size > 2000) throw new HttpsError('resource-exhausted', 'The staff directory is too large to validate username uniqueness safely.');
  if (activeRoles.docs.some(document =>
    document.get('user_id') !== exceptUid && textField(document.get('username'))?.toLowerCase() === normalized)) {
    throw new HttpsError('already-exists', 'That username is already assigned to another active staff account.');
  }
}

async function managedRoleRows(context: StaffContext): Promise<Array<{
  uid: string; roleRef: FirebaseFirestore.DocumentReference; role: RoleRecord; assignments: string[]
}>> {
  if (!GLOBAL_ROLES.has(context.role) && !DEPARTMENT_ROLES.has(context.role)) {
    throw new HttpsError('permission-denied', 'Only central or department coordinators can manage staff accounts.');
  }
  const snapshot = await context.db.collection('adminRoles').where('active', '==', true).limit(1000).get();
  const rows = snapshot.docs.map(document => ({
    uid: textField(document.get('user_id')) || '',
    roleRef: document.ref,
    role: document.data() as RoleRecord,
  })).filter(row => row.uid && canManageStaffRole(
    context,
    textField(row.role.role) || '',
    textField(row.role.department_code)?.toUpperCase(),
    textField(row.role.cluster_code)?.toUpperCase(),
  ));
  return Promise.all(rows.map(async row => {
    const assignments = await context.db.collection('adminEventAssignments')
      .where('admin_user_id', '==', row.uid).limit(MAX_STAFF_EVENT_RESULTS + 1).get();
    if (assignments.size > MAX_STAFF_EVENT_RESULTS) throw new HttpsError('failed-precondition', 'A staff account has too many event assignments.');
    return { ...row, assignments: assignments.docs.map(document => textField(document.get('event_id')) || '').filter(Boolean) };
  }));
}

/** Staff account CRUD. Authorization is derived from the active Firebase role,
 * never from a role name or department supplied by the browser. */
export const manageStaffAccount = onCall({ enforceAppCheck: false, timeoutSeconds: 120 }, async request => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in with an authorized staff account.');
  const context = await loadStaffContext(uid, request.auth?.token?.email);
  const action = textField(request.data?.action)?.toLowerCase();
  const auth = getAuth();
  const roles = context.db.collection('adminRoles');

  if (action === 'list') {
    const rows = await managedRoleRows(context);
    return { admins: rows.map(row => managedAdminPayload(row.uid, null, row.role, row.assignments)) };
  }

  if (action === 'create' || action === 'assign_existing') {
    const input = action === 'create' ? request.data?.admin as Record<string, unknown> : request.data;
    if (!input || typeof input !== 'object') throw new HttpsError('invalid-argument', 'Staff account details are required.');
    const role = requiredAdminRole(input.role);
    const departmentCode = textField(input.departmentCode)?.toUpperCase();
    const clusterCode = textField(input.clusterCode)?.toUpperCase();
    if ((DEPARTMENT_ROLES.has(role) || EVENT_ROLES.has(role)) && !departmentCode) {
      throw new HttpsError('invalid-argument', 'A department is required for this staff role.');
    }
    if (clusterCode && (departmentCode !== 'CSE' || !CSE_CLUSTERS.has(clusterCode))) {
      throw new HttpsError('invalid-argument', 'Choose a valid CSE cluster.');
    }
    if ((DEPARTMENT_ROLES.has(role) || EVENT_ROLES.has(role)) && departmentCode === 'CSE' && !clusterCode) {
      throw new HttpsError('invalid-argument', 'A CSE staff member must have a cluster assignment.');
    }
    if (!canManageStaffRole(context, role, departmentCode, clusterCode)) {
      throw new HttpsError('permission-denied', 'You cannot create this staff role or department scope.');
    }
    const designation = textField(input.designation) || 'Staff';
    const assignedEvents = await resolveManagedAssignments(context, role, departmentCode, clusterCode, input.assignedEvents);
    let authUser: Awaited<ReturnType<typeof auth.getUser>>;
    let fullName: string;
    let email: string;
    let username: string;
    if (action === 'create') {
      fullName = requiredText(input.fullName, 'Full name', 120);
      email = requiredText(input.email, 'Email', 180).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpsError('invalid-argument', 'Enter a valid staff email address.');
      username = requiredText(input.username, 'Username', 60);
      if (!/^[a-zA-Z0-9._-]+$/.test(username)) throw new HttpsError('invalid-argument', 'Username may contain letters, numbers, dots, underscores, and hyphens.');
      await assertUniqueStaffUsername(context.db, username);
      const password = typeof input.password === 'string' ? input.password : '';
      if (password.length < 8) throw new HttpsError('invalid-argument', 'Initial password must be at least 8 characters.');
      try {
        authUser = await auth.createUser({ email, password, displayName: fullName, disabled: false });
      } catch (error) {
        const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
        if (code.includes('email-already-exists')) throw new HttpsError('already-exists', 'A Firebase account already uses this email. Choose “Assign existing account”.');
        throw new HttpsError('internal', 'Firebase could not create this staff account.');
      }
    } else {
      const identifier = requiredText(input.identifier, 'Existing account email or ID', 180);
      try {
        authUser = identifier.includes('@') ? await auth.getUserByEmail(identifier.toLowerCase()) : await auth.getUser(identifier);
      } catch {
        throw new HttpsError('not-found', 'No Firebase account was found for that email or ID.');
      }
      if (authUser.disabled) throw new HttpsError('failed-precondition', 'This Firebase account is disabled.');
      email = authUser.email?.trim().toLowerCase() || '';
      if (!email || (textField(input.email) && textField(input.email)?.toLowerCase() !== email)) {
        throw new HttpsError('invalid-argument', 'The email must match the existing Firebase account.');
      }
      fullName = textField(input.fullName) || authUser.displayName || email.split('@')[0];
      const existingRoleRows = await roles.where('user_id', '==', authUser.uid).limit(1).get();
      username = textField(input.username) || textField(existingRoleRows.docs[0]?.get('username')) || email.split('@')[0];
      if (!/^[a-zA-Z0-9._-]+$/.test(username)) throw new HttpsError('invalid-argument', 'The assigned account needs a valid username.');
      await assertUniqueStaffUsername(context.db, username, authUser.uid);
    }
    const existingRoles = await roles.where('user_id', '==', authUser.uid).get();
    if (existingRoles.docs.some(document => document.get('active') === true)) {
      if (action === 'create') await auth.deleteUser(authUser.uid).catch(() => undefined);
      throw new HttpsError('already-exists', 'This Firebase account already has an active staff role.');
    }
    const roleRef = existingRoles.docs[0]?.ref || roles.doc(randomUUID());
    const roleData = {
      id: roleRef.id,
      user_id: authUser.uid,
      username,
      normalized_username: username.toLowerCase(),
      full_name: fullName,
      designation,
      role,
      department_code: departmentCode || null,
      cluster_code: clusterCode || null,
      email,
      phone: textField(input.phone) || null,
      access_boundary: textField(input.accessBoundary) || null,
      active: true,
      updated_at: new Date().toISOString(),
    };
    const batch = context.db.batch();
    batch.set(roleRef, roleData);
    for (const eventId of assignedEvents) {
      const assignmentRef = context.db.collection('adminEventAssignments').doc(`${authUser.uid}__${eventId}`);
      batch.set(assignmentRef, { id: assignmentRef.id, admin_user_id: authUser.uid, event_id: eventId, assigned_by: uid, assigned_at: new Date().toISOString() });
    }
    try {
      await batch.commit();
    } catch {
      if (action === 'create') await auth.deleteUser(authUser.uid).catch(() => undefined);
      throw new HttpsError('internal', 'The staff role could not be saved. The account creation was rolled back where possible.');
    }
    return { admin: managedAdminPayload(authUser.uid, authUser, roleData, assignedEvents) };
  }

  if (action === 'update') {
    const targetUid = requiredText(request.data?.id, 'Staff account ID', 80);
    if (targetUid === uid) throw new HttpsError('failed-precondition', 'You cannot change your own administrative role here.');
    const roleSnapshot = await roles.where('user_id', '==', targetUid).where('active', '==', true).get();
    if (roleSnapshot.size !== 1) throw new HttpsError('not-found', 'An active staff role was not found for this account.');
    const roleRef = roleSnapshot.docs[0].ref;
    const currentRole = roleSnapshot.docs[0].data() as RoleRecord;
    if (!canManageStaffRole(context, textField(currentRole.role) || '', textField(currentRole.department_code)?.toUpperCase(), textField(currentRole.cluster_code)?.toUpperCase())) {
      throw new HttpsError('permission-denied', 'You cannot update this staff account.');
    }
    const updates = request.data?.updates && typeof request.data.updates === 'object'
      ? request.data.updates as Record<string, unknown> : {};
    if (typeof updates.password === 'string' && updates.password.length) {
      throw new HttpsError('failed-precondition', 'Staff passwords are changed by the account holder after signing in.');
    }
    const nextRole = updates.role === undefined ? String(currentRole.role) : requiredAdminRole(updates.role);
    const departmentCode = updates.departmentCode === undefined
      ? textField(currentRole.department_code)?.toUpperCase() : textField(updates.departmentCode)?.toUpperCase();
    const clusterCode = updates.clusterCode === undefined
      ? textField(currentRole.cluster_code)?.toUpperCase() : textField(updates.clusterCode)?.toUpperCase();
    if (!canManageStaffRole(context, nextRole, departmentCode, clusterCode)) {
      throw new HttpsError('permission-denied', 'You cannot assign this staff role or department scope.');
    }
    if ((DEPARTMENT_ROLES.has(nextRole) || EVENT_ROLES.has(nextRole)) && !departmentCode) {
      throw new HttpsError('invalid-argument', 'A department is required for this staff role.');
    }
    if ((DEPARTMENT_ROLES.has(nextRole) || EVENT_ROLES.has(nextRole)) && departmentCode === 'CSE' && !CSE_CLUSTERS.has(clusterCode || '')) {
      throw new HttpsError('invalid-argument', 'A valid CSE cluster assignment is required.');
    }
    const authUser = await auth.getUser(targetUid);
    const username = updates.username === undefined ? textField(currentRole.username) || authUser.email?.split('@')[0] || targetUid : requiredText(updates.username, 'Username', 60);
    await assertUniqueStaffUsername(context.db, username, targetUid);
    const assignmentSnapshot = await context.db.collection('adminEventAssignments').where('admin_user_id', '==', targetUid).limit(201).get();
    if (assignmentSnapshot.size > 200) throw new HttpsError('failed-precondition', 'This account has too many event assignments to update safely.');
    const requestedAssignmentIds = updates.assignedEvents === undefined
      ? ASSIGNED_EVENT_ROLES.has(nextRole)
        ? assignmentSnapshot.docs.map(document => textField(document.get('event_id')) || '').filter(Boolean)
        : []
      : updates.assignedEvents;
    const requestedAssignments = await resolveManagedAssignments(context, nextRole, departmentCode, clusterCode, requestedAssignmentIds);
    const roleData = {
      ...currentRole,
      username,
      normalized_username: username.toLowerCase(),
      full_name: updates.fullName === undefined ? textField(currentRole.full_name) || authUser.displayName || 'Staff member' : requiredText(updates.fullName, 'Full name', 120),
      designation: updates.designation === undefined ? textField(currentRole.designation) || 'Staff' : requiredText(updates.designation, 'Designation', 120),
      phone: updates.phone === undefined ? textField(currentRole.phone) || null : textField(updates.phone) || null,
      access_boundary: updates.accessBoundary === undefined ? textField(currentRole.access_boundary) || null : textField(updates.accessBoundary) || null,
      role: nextRole,
      department_code: departmentCode || null,
      cluster_code: clusterCode || null,
      updated_at: new Date().toISOString(),
    };
    const batch = context.db.batch();
    batch.set(roleRef, roleData);
    for (const document of assignmentSnapshot.docs) batch.delete(document.ref);
    for (const eventId of requestedAssignments) {
      const assignmentRef = context.db.collection('adminEventAssignments').doc(`${targetUid}__${eventId}`);
      batch.set(assignmentRef, { id: assignmentRef.id, admin_user_id: targetUid, event_id: eventId, assigned_by: uid, assigned_at: new Date().toISOString() });
    }
    if (assignmentSnapshot.size + requestedAssignments.length > 450) {
      throw new HttpsError('resource-exhausted', 'The assignment update is too large to commit safely.');
    }
    await batch.commit();
    return { admin: managedAdminPayload(targetUid, authUser, roleData, requestedAssignments) };
  }

  if (action === 'delete') {
    const targetUid = requiredText(request.data?.id, 'Staff account ID', 80);
    if (targetUid === uid) throw new HttpsError('failed-precondition', 'You cannot delete your own staff account.');
    const targetRoles = await roles.where('user_id', '==', targetUid).get();
    const activeRole = targetRoles.docs.find(document => document.get('active') === true);
    const roleData = activeRole?.data() as RoleRecord | undefined;
    if (!roleData || !canManageStaffRole(context, textField(roleData.role) || '', textField(roleData.department_code)?.toUpperCase(), textField(roleData.cluster_code)?.toUpperCase())) {
      throw new HttpsError('permission-denied', 'You cannot delete this staff account.');
    }
    const assignmentSnapshot = await context.db.collection('adminEventAssignments').where('admin_user_id', '==', targetUid).limit(1000).get();
    const docs = [...targetRoles.docs, ...assignmentSnapshot.docs];
    for (let index = 0; index < docs.length; index += 450) {
      const batch = context.db.batch();
      for (const document of docs.slice(index, index + 450)) batch.delete(document.ref);
      await batch.commit();
    }
    await auth.deleteUser(targetUid).catch(() => {
      throw new HttpsError('failed-precondition', 'The role was removed, but Firebase Auth could not delete the account. Disable or remove it in Firebase Authentication.');
    });
    return { success: true };
  }

  throw new HttpsError('invalid-argument', 'Unknown staff account operation.');
});

function requiredText(value: unknown, field: string, maxLength: number): string {
  const result = textField(value);
  if (!result || result.length > maxLength) {
    throw new HttpsError('invalid-argument', `${field} is required and must be at most ${maxLength} characters.`);
  }
  return result;
}

function departmentPayload(id: string, data: Record<string, unknown>) {
  return {
    id,
    code: textField(data.code) || '',
    name: textField(data.name) || '',
    description: textField(data.description) || '',
    chiefCoordinator: textField(data.chief_coordinator) || '',
    contact: textField(data.contact) || '',
    iconName: textField(data.icon_name) || 'Cpu',
  };
}

function announcementPayload(id: string, data: Record<string, unknown>) {
  return {
    id,
    title: textField(data.title) || '',
    message: textField(data.message) || '',
    type: textField(data.type) || 'general',
    scope: textField(data.scope) || 'fest-wide',
    departmentCode: textField(data.department_code) || undefined,
    date: textField(data.date_display) || '',
  };
}

export const listPublicAnnouncements = onCall(async () => {
  const snapshot = await getFirestore().collection('publicAnnouncements').orderBy('created_at', 'desc').limit(100).get();
  return { announcements: snapshot.docs.map(document => announcementPayload(document.id, document.data())) };
});

/**
 * Public catalog data is served from the trusted Firebase runtime. Keep the
 * response limited to the published projection; never expose private event
 * documents, registrations, payment data, or staff role records here.
 */
export const listPublicEvents = onCall({ enforceAppCheck: false }, async () => {
  const snapshot = await getFirestore().collection('publicEvents')
    .where('isPublished', '==', true)
    .limit(500)
    .get();

  const events = snapshot.docs.flatMap(document => {
    const data = document.data() as Record<string, unknown>;
    if (data.id !== document.id || data.status !== 'open' || data.approvalStatus !== 'approved') return [];
    if (!EVENT_CATEGORIES.has(String(data.category)) || !EVENT_FORMATS.has(String(data.format))) return [];

    const deadlineValue = data.deadline as { toDate?: () => Date } | Date | string | null | undefined;
    const deadline = deadlineValue && typeof deadlineValue === 'object' && 'toDate' in deadlineValue && typeof deadlineValue.toDate === 'function'
      ? deadlineValue.toDate().toISOString()
      : deadlineValue instanceof Date
        ? deadlineValue.toISOString()
        : typeof deadlineValue === 'string' ? deadlineValue : '';
    const prizes = data.prizes && typeof data.prizes === 'object' && !Array.isArray(data.prizes)
      ? data.prizes as Record<string, unknown>
      : {};
    const faqs = Array.isArray(data.faqs)
      ? data.faqs.flatMap(value => {
          if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
          const faq = value as Record<string, unknown>;
          return typeof faq.question === 'string' && typeof faq.answer === 'string'
            ? [{ question: faq.question, answer: faq.answer }]
            : [];
        })
      : [];

    return [{
      id: document.id,
      isPublished: true,
      slug: textField(data.slug) || '',
      title: textField(data.title) || '',
      tagline: textField(data.tagline),
      departmentId: textField(data.departmentId),
      departmentCode: textField(data.departmentCode) || '',
      category: data.category,
      format: data.format,
      minTeamSize: Number(data.minTeamSize) || 0,
      maxTeamSize: Number(data.maxTeamSize) || 0,
      fee: Number(data.fee) || 0,
      capacity: Number(data.capacity) || 0,
      registeredCount: Number(data.registeredCount) || 0,
      deadline,
      date: textField(data.date) || '',
      time: textField(data.time) || '',
      venue: textField(data.venue) || '',
      description: textField(data.description) || '',
      rules: Array.isArray(data.rules) ? data.rules.filter((rule): rule is string => typeof rule === 'string') : [],
      prizes: {
        first: textField(prizes.first) || 'Trophy',
        second: textField(prizes.second),
        third: textField(prizes.third),
        special: textField(prizes.special),
      },
      eligibility: textField(data.eligibility),
      coordinatorName: textField(data.coordinatorName) || '',
      coordinatorPhone: textField(data.coordinatorPhone) || '',
      coordinatorEmail: textField(data.coordinatorEmail) || '',
      status: 'open',
      faqs,
      approvalStatus: 'approved',
    }];
  }).sort((left, right) => String(left.title).localeCompare(String(right.title)));

  return { events };
});

export const listPublicDepartments = onCall({ enforceAppCheck: false }, async () => {
  const snapshot = await getFirestore().collection('departments').limit(100).get();
  return { departments: snapshot.docs.map(document => departmentPayload(document.id, document.data())) };
});

function sponsorProfilePayload(id: string, raw: Record<string, unknown>, publicOnly = false) {
  const projectValues = raw.keyProjects ?? raw.key_projects;
  const deliverables = Array.isArray(raw.deliverables) ? raw.deliverables.slice(0, 100).map(value => {
    const item = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
    return {
      id: textField(item.id) || '',
      title: textField(item.title) || '',
      category: textField(item.category) || 'branding',
      status: textField(item.status) || 'scheduled',
      description: textField(item.description) || '',
      dueDate: textField(item.dueDate ?? item.due_date) || '',
      location: textField(item.location) || undefined,
    };
  }).filter(item => item.id && item.title) : [];
  const metricsRaw = raw.metrics && typeof raw.metrics === 'object' ? raw.metrics as Record<string, unknown> : {};
  const profile: Record<string, unknown> = {
    id,
    companyName: textField(raw.companyName ?? raw.company_name) || '',
    tagline: textField(raw.tagline) || '',
    tier: textField(raw.tier) || 'Official Event Partner',
    tierBadgeColor: textField(raw.tierBadgeColor ?? raw.tier_badge_color) || '#38BDF8',
    logo: textField(raw.logo) || '',
    website: textField(raw.website) || '',
    pocName: textField(raw.pocName ?? raw.poc_name) || '',
    pocRole: textField(raw.pocRole ?? raw.poc_role) || '',
    pocContact: textField(raw.pocContact ?? raw.poc_contact) || '',
    deliverables,
    about: textField(raw.about) || undefined,
    headquarters: textField(raw.headquarters) || undefined,
    awardHighlight: textField(raw.awardHighlight ?? raw.award_highlight) || undefined,
    keyProjects: Array.isArray(projectValues)
      ? projectValues.filter((value): value is string => typeof value === 'string').slice(0, 50).map(value => value.slice(0, 240))
      : undefined,
  };
  if (!publicOnly) {
    profile.pocEmail = textField(raw.pocEmail ?? raw.poc_email) || '';
    profile.sacLeadName = textField(raw.sacLeadName ?? raw.sac_lead_name) || '';
    profile.sacLeadContact = textField(raw.sacLeadContact ?? raw.sac_lead_contact) || '';
    profile.stallLocation = textField(raw.stallLocation ?? raw.stall_location) || '';
    profile.stallNumber = textField(raw.stallNumber ?? raw.stall_number) || '';
    profile.mouStatus = textField(raw.mouStatus ?? raw.mou_status) || 'Under Review';
    profile.invoiceStatus = textField(raw.invoiceStatus ?? raw.invoice_status) || 'Processing';
    profile.metrics = {
      stageKeynoteTime: textField(metricsRaw.stageKeynoteTime ?? metricsRaw.stage_keynote_time) || '',
      brandedBannersAllocated: Number(metricsRaw.brandedBannersAllocated ?? metricsRaw.branded_banners_allocated) || 0,
      vipLoungePasses: Number(metricsRaw.vipLoungePasses ?? metricsRaw.vip_lounge_passes) || 0,
      estimatedReach: textField(metricsRaw.estimatedReach ?? metricsRaw.estimated_reach) || '',
      impressionsCount: textField(metricsRaw.impressionsCount ?? metricsRaw.impressions_count) || '',
    };
  } else {
    // Keep the view model shape without disclosing financial, SAC, or private
    // email fields to the unauthenticated public sponsor page.
    profile.pocEmail = '';
    profile.sacLeadName = '';
    profile.sacLeadContact = '';
    profile.stallLocation = '';
    profile.stallNumber = '';
    profile.mouStatus = 'Under Review';
    profile.invoiceStatus = 'Processing';
    profile.metrics = {
      stageKeynoteTime: '', brandedBannersAllocated: 0, vipLoungePasses: 0,
      estimatedReach: '', impressionsCount: '',
    };
  }
  return profile;
}

function validateSponsorInput(input: unknown, id: string): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpsError('invalid-argument', 'Sponsor profile details are required.');
  const raw = input as Record<string, unknown>;
  const profile = sponsorProfilePayload(id, raw);
  const allowedTiers = ['Title Sponsor', 'Platinum Partner', 'Gold Sponsor', 'Official Event Partner', 'Official Tech Partner'];
  if (!textField(profile.companyName)) throw new HttpsError('invalid-argument', 'Sponsor company name is required.');
  if (!allowedTiers.includes(String(profile.tier))) throw new HttpsError('invalid-argument', 'Choose a supported sponsor tier.');
  const website = textField(profile.website);
  if (website) {
    try {
      const parsed = new URL(website);
      if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error();
    } catch {
      throw new HttpsError('invalid-argument', 'Sponsor website must be a valid HTTP or HTTPS URL.');
    }
  }
  const logo = textField(profile.logo);
  if (logo && (/^javascript:/i.test(logo) || /^data:/i.test(logo))) throw new HttpsError('invalid-argument', 'Sponsor logo must use a hosted image URL or site path.');
  const deliverables = profile.deliverables as Array<Record<string, unknown>>;
  if (deliverables.length > 100) throw new HttpsError('invalid-argument', 'A sponsor can have at most 100 deliverables.');
  for (const item of deliverables) {
    if (!['branding', 'on_ground', 'digital', 'stage'].includes(String(item.category)) ||
        !['completed', 'in_progress', 'scheduled'].includes(String(item.status))) {
      throw new HttpsError('invalid-argument', 'A sponsor deliverable has an unsupported category or status.');
    }
  }
  return profile;
}

export const listPublicSponsorProfiles = onCall(async () => {
  const snapshot = await getFirestore().collection('sponsorProfiles').limit(100).get();
  return {
    sponsors: snapshot.docs.map(document => sponsorProfilePayload(document.id, document.data(), true))
      .filter(profile => textField(profile.companyName)),
  };
});

export const manageSponsorProfile = onCall({ enforceAppCheck: false }, async request => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in with an authorized staff account.');
  const context = await loadStaffContext(uid, request.auth?.token?.email);
  if (!GLOBAL_ROLES.has(context.role)) throw new HttpsError('permission-denied', 'Only central administrators can manage sponsor profiles.');
  const sponsors = context.db.collection('sponsorProfiles');
  const projections = context.db.collection('publicSponsorProfiles');
  const action = textField(request.data?.action)?.toLowerCase();

  if (action === 'list') {
    const snapshot = await sponsors.limit(200).get();
    return { sponsors: snapshot.docs.map(document => sponsorProfilePayload(document.id, document.data())) };
  }

  if (action === 'create') {
    const id = randomUUID();
    const profile = validateSponsorInput(request.data?.sponsor, id);
    const now = new Date().toISOString();
    const full = { ...profile, created_at: now, updated_at: now };
    const publicProfile = { ...sponsorProfilePayload(id, profile, true), updatedAt: now };
    await context.db.runTransaction(async transaction => {
      transaction.create(sponsors.doc(id), full);
      transaction.create(projections.doc(id), publicProfile);
    });
    return { sponsor: sponsorProfilePayload(id, full) };
  }

  if (action === 'update' || action === 'delete') {
    const id = requiredText(request.data?.id, 'Sponsor ID', 100);
    const ref = sponsors.doc(id);
    const projectionRef = projections.doc(id);
    let updated: Record<string, unknown> | null = null;
    await context.db.runTransaction(async transaction => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw new HttpsError('not-found', 'Sponsor profile was not found.');
      if (action === 'delete') {
        transaction.delete(ref);
        transaction.delete(projectionRef);
        return;
      }
      const current = snapshot.data() as Record<string, unknown>;
      const merged = validateSponsorInput({ ...current, ...(request.data?.sponsor as Record<string, unknown> || {}) }, id);
      const now = new Date().toISOString();
      updated = { ...merged, created_at: current.created_at || now, updated_at: now };
      transaction.set(ref, updated);
      transaction.set(projectionRef, { ...sponsorProfilePayload(id, updated, true), updatedAt: now });
    });
    return action === 'delete' ? { success: true } : { sponsor: sponsorProfilePayload(id, updated || {}) };
  }

  if (action === 'reset') {
    const rawProfiles = request.data?.sponsors;
    if (!Array.isArray(rawProfiles) || rawProfiles.length === 0 || rawProfiles.length > 100) {
      throw new HttpsError('invalid-argument', 'Provide between 1 and 100 sponsor profiles to reset.');
    }
    const current = await sponsors.limit(201).get();
    if (current.size > 200) throw new HttpsError('resource-exhausted', 'There are too many sponsor profiles for a safe reset.');
    if (current.size + rawProfiles.length > 250) {
      throw new HttpsError('resource-exhausted', 'Sponsor reset exceeds Firestore’s 500-write batch limit. Delete or update sponsors in smaller batches.');
    }
    const validated = rawProfiles.map(raw => {
      const profile = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
      const id = requiredText(profile.id, 'Sponsor ID', 100);
      return { id, data: validateSponsorInput(profile, id) };
    });
    if (new Set(validated.map(item => item.id)).size !== validated.length) throw new HttpsError('invalid-argument', 'Sponsor IDs must be unique.');
    const batch = context.db.batch();
    for (const document of current.docs) {
      batch.delete(document.ref);
      batch.delete(projections.doc(document.id));
    }
    const now = new Date().toISOString();
    for (const profile of validated) {
      const full = { ...profile.data, created_at: now, updated_at: now };
      batch.set(sponsors.doc(profile.id), full);
      batch.set(projections.doc(profile.id), { ...sponsorProfilePayload(profile.id, full, true), updatedAt: now });
    }
    await batch.commit();
    return { success: true };
  }

  throw new HttpsError('invalid-argument', 'Unknown sponsor profile operation.');
});

export const manageAnnouncement = onCall({ enforceAppCheck: false }, async request => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in with an authorized staff account.');
  const context = await loadStaffContext(uid, request.auth?.token?.email);
  const action = textField(request.data?.action)?.toLowerCase();
  const announcements = context.db.collection('announcements');
  const projections = context.db.collection('publicAnnouncements');

  if (action === 'create') {
    if (!GLOBAL_ROLES.has(context.role) && !DEPARTMENT_ROLES.has(context.role)) {
      throw new HttpsError('permission-denied', 'This staff role cannot publish announcements.');
    }
    const input = request.data?.announcement;
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpsError('invalid-argument', 'Announcement details are required.');
    const raw = input as Record<string, unknown>;
    const title = requiredText(raw.title, 'Announcement title', 140);
    const message = requiredText(raw.message, 'Announcement message', 4000);
    const type = textField(raw.type) || 'general';
    if (!['urgent', 'general', 'prize', 'workshop'].includes(type)) throw new HttpsError('invalid-argument', 'Choose a supported announcement type.');
    const scope = GLOBAL_ROLES.has(context.role) ? textField(raw.scope) || 'fest-wide' : 'department';
    if (!['fest-wide', 'department'].includes(scope)) throw new HttpsError('invalid-argument', 'Choose a supported announcement scope.');
    const requestedDepartment = textField(raw.departmentCode)?.toUpperCase();
    const departmentCode = scope === 'department'
      ? (GLOBAL_ROLES.has(context.role) ? requestedDepartment : context.departmentCode)
      : undefined;
    if (scope === 'department' && (!departmentCode || (!GLOBAL_ROLES.has(context.role) && requestedDepartment && requestedDepartment !== context.departmentCode))) {
      throw new HttpsError('permission-denied', 'You cannot publish an announcement outside your department.');
    }
    const id = randomUUID();
    const now = new Date().toISOString();
    const row = {
      id, title, message, type, scope,
      department_code: departmentCode || null,
      published_by: uid,
      date_display: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      created_at: now,
      updated_at: now,
    };
    const publicRow = {
      id, title, message, type, scope,
      department_code: departmentCode || null,
      date_display: row.date_display,
      created_at: now,
    };
    if (departmentCode) {
      const department = await context.db.collection('departments').where('code', '==', departmentCode).limit(1).get();
      if (department.empty) throw new HttpsError('failed-precondition', 'The selected department is not configured in Firebase.');
    }
    await context.db.runTransaction(async transaction => {
      transaction.create(announcements.doc(id), row);
      transaction.create(projections.doc(id), publicRow);
    });
    return { announcement: announcementPayload(id, publicRow) };
  }

  if (action === 'delete') {
    const id = requiredText(request.data?.id, 'Announcement ID', 100);
    const ref = announcements.doc(id);
    const projectionRef = projections.doc(id);
    await context.db.runTransaction(async transaction => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw new HttpsError('not-found', 'Announcement was not found.');
      const row = snapshot.data() as Record<string, unknown>;
      const allowed = GLOBAL_ROLES.has(context.role) || (
        DEPARTMENT_ROLES.has(context.role) && row.scope === 'department' &&
        textField(row.department_code)?.toUpperCase() === context.departmentCode
      );
      if (!allowed) throw new HttpsError('permission-denied', 'This announcement is outside your staff scope.');
      transaction.delete(ref);
      transaction.delete(projectionRef);
    });
    return { success: true };
  }

  throw new HttpsError('invalid-argument', 'Unknown announcement operation.');
});

export const manageDepartment = onCall({ enforceAppCheck: false }, async request => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in with an authorized staff account.');
  const context = await loadStaffContext(uid, request.auth?.token?.email);
  if (!GLOBAL_ROLES.has(context.role)) throw new HttpsError('permission-denied', 'Only central administrators can manage departments.');
  const action = textField(request.data?.action)?.toLowerCase();
  const departments = context.db.collection('departments');

  if (action === 'create') {
    const input = request.data?.department;
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpsError('invalid-argument', 'Department details are required.');
    const raw = input as Record<string, unknown>;
    const code = requiredText(raw.code, 'Department code', 30).toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9_-]{1,29}$/.test(code)) throw new HttpsError('invalid-argument', 'Department code may contain letters, numbers, underscore, and hyphen.');
    const data = {
      code,
      name: requiredText(raw.name, 'Department name', 120),
      description: textField(raw.description) || '',
      chief_coordinator: textField(raw.chiefCoordinator) || '',
      contact: textField(raw.contact) || '',
      icon_name: textField(raw.iconName) || 'Cpu',
    };
    const ref = departments.doc(randomUUID());
    const claimRef = context.db.collection('departmentCodeClaims').doc(code);
    const codeQuery = departments.where('code', '==', code).limit(2);
    await context.db.runTransaction(async transaction => {
      const [matches, claim] = await Promise.all([transaction.get(codeQuery), transaction.get(claimRef)]);
      if (!matches.empty || claim.exists) throw new HttpsError('already-exists', 'That department code is already in use.');
      transaction.create(ref, { id: ref.id, ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      transaction.create(claimRef, { department_id: ref.id, code, created_at: new Date().toISOString() });
    });
    return { department: departmentPayload(ref.id, data) };
  }

  const key = requiredText(request.data?.id, 'Department ID or code', 100);
  let departmentSnapshot: FirebaseFirestore.DocumentSnapshot | undefined;
  if (EVENT_ID_PATTERN.test(key)) {
    const direct = await departments.doc(key).get();
    if (direct.exists) departmentSnapshot = direct;
  }
  if (!departmentSnapshot) {
    const matches = await departments.where('code', '==', key.toUpperCase()).limit(2).get();
    if (matches.size > 1) throw new HttpsError('failed-precondition', 'This department code is duplicated in the database.');
    departmentSnapshot = matches.docs[0];
  }
  if (!departmentSnapshot?.exists) throw new HttpsError('not-found', 'Department was not found.');
  const departmentRef = departmentSnapshot.ref;
  const current = departmentSnapshot.data() as Record<string, unknown>;
  const oldCode = textField(current.code)?.toUpperCase() || '';
  const oldClaimRef = context.db.collection('departmentCodeClaims').doc(oldCode);

  if (action === 'update') {
    const input = request.data?.department;
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpsError('invalid-argument', 'Department changes are required.');
    const raw = input as Record<string, unknown>;
    const code = raw.code === undefined ? oldCode : requiredText(raw.code, 'Department code', 30).toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9_-]{1,29}$/.test(code)) throw new HttpsError('invalid-argument', 'Department code may contain letters, numbers, underscore, and hyphen.');
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString(), code };
    if (raw.name !== undefined) patch.name = requiredText(raw.name, 'Department name', 120);
    if (raw.description !== undefined) patch.description = textField(raw.description) || '';
    if (raw.chiefCoordinator !== undefined) patch.chief_coordinator = textField(raw.chiefCoordinator) || '';
    if (raw.contact !== undefined) patch.contact = textField(raw.contact) || '';
    if (raw.iconName !== undefined) patch.icon_name = textField(raw.iconName) || 'Cpu';
    const claimRef = context.db.collection('departmentCodeClaims').doc(code);
    const codeQuery = departments.where('code', '==', code).limit(2);
    await context.db.runTransaction(async transaction => {
      const [fresh, matches, newClaim, oldClaim] = await Promise.all([
        transaction.get(departmentRef), transaction.get(codeQuery), transaction.get(claimRef), transaction.get(oldClaimRef),
      ]);
      if (!fresh.exists) throw new HttpsError('not-found', 'Department was not found.');
      if (matches.docs.some(document => document.id !== departmentRef.id) || (newClaim.exists && newClaim.get('department_id') !== departmentRef.id)) {
        throw new HttpsError('already-exists', 'That department code is already in use.');
      }
      transaction.update(departmentRef, patch);
      if (!newClaim.exists) transaction.create(claimRef, { department_id: departmentRef.id, code, created_at: new Date().toISOString() });
      if (oldCode !== code && oldClaim.exists && oldClaim.get('department_id') === departmentRef.id) transaction.delete(oldClaimRef);
    });
    return { department: departmentPayload(departmentRef.id, { ...current, ...patch }) };
  }

  if (action === 'delete') {
    const eventQuery = context.db.collection('events').where('department_code', '==', oldCode).limit(1);
    const rolesQuery = context.db.collection('adminRoles').where('department_code', '==', oldCode).limit(1);
    await context.db.runTransaction(async transaction => {
      const [fresh, events, roles, claim] = await Promise.all([
        transaction.get(departmentRef), transaction.get(eventQuery), transaction.get(rolesQuery), transaction.get(oldClaimRef),
      ]);
      if (!fresh.exists) throw new HttpsError('not-found', 'Department was not found.');
      if (!events.empty || !roles.empty) throw new HttpsError('failed-precondition', 'Reassign or remove this department’s events and staff roles before deleting it.');
      transaction.delete(departmentRef);
      if (claim.exists && claim.get('department_id') === departmentRef.id) transaction.delete(oldClaimRef);
    });
    return { success: true };
  }

  throw new HttpsError('invalid-argument', 'Unknown department operation.');
});

function safeEventSlug(value: unknown): string {
  const slug = requiredText(value, 'Event URL slug', 96).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new HttpsError('invalid-argument', 'Event URL slug may contain lowercase letters, numbers, and single hyphens.');
  }
  return slug;
}

function validateEventFields(input: Record<string, unknown>, departmentCode: string, clusterCode?: string) {
  const title = requiredText(input.title, 'Event title', 140);
  const slug = safeEventSlug(input.slug);
  const category = textField(input.category)?.toLowerCase();
  const format = textField(input.format)?.toLowerCase();
  if (!category || !EVENT_CATEGORIES.has(category)) throw new HttpsError('invalid-argument', 'Choose a supported event category.');
  if (!format || !EVENT_FORMATS.has(format)) throw new HttpsError('invalid-argument', 'Choose a supported participation format.');

  const minTeamSize = Number(input.minTeamSize);
  const maxTeamSize = Number(input.maxTeamSize);
  const fee = Number(input.fee);
  const capacity = Number(input.capacity);
  if (!Number.isSafeInteger(minTeamSize) || !Number.isSafeInteger(maxTeamSize) || minTeamSize < 1 || maxTeamSize < minTeamSize || maxTeamSize > 20) {
    throw new HttpsError('invalid-argument', 'Team size must be between 1 and 20, with maximum at least minimum.');
  }
  if (!Number.isFinite(fee) || fee < 0 || fee > 1_000_000) throw new HttpsError('invalid-argument', 'Event fee must be between ₹0 and ₹10,00,000.');
  if (!Number.isSafeInteger(capacity) || capacity < 0) throw new HttpsError('invalid-argument', 'Event capacity must be zero or greater.');
  if (format === 'individual' && (minTeamSize !== 1 || maxTeamSize !== 1)) {
    throw new HttpsError('invalid-argument', 'Individual events must have a team size of exactly one.');
  }
  if (format === 'duo' && (minTeamSize !== 2 || maxTeamSize !== 2)) {
    throw new HttpsError('invalid-argument', 'Duo events must have a team size of exactly two.');
  }

  const deadline = textField(input.deadline) || null;
  if (deadline && !Number.isFinite(Date.parse(deadline))) throw new HttpsError('invalid-argument', 'Registration deadline is invalid.');
  const coordinatorEmail = requiredText(input.coordinatorEmail, 'Coordinator email', 180).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(coordinatorEmail)) throw new HttpsError('invalid-argument', 'Coordinator email is invalid.');
  const whatsappGroupLink = textField(input.whatsappGroupLink)?.slice(0, 1000) || null;
  if (whatsappGroupLink) {
    let parsed: URL;
    try { parsed = new URL(whatsappGroupLink); } catch { throw new HttpsError('invalid-argument', 'WhatsApp group link is invalid.'); }
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'chat.whatsapp.com') {
      throw new HttpsError('invalid-argument', 'WhatsApp group link must use the official https://chat.whatsapp.com domain.');
    }
  }
  const arrayOfText = (value: unknown, field: string, maxItems: number): string[] => {
    if (value === undefined || value === null) return [];
    if (!Array.isArray(value) || value.length > maxItems || value.some(item => typeof item !== 'string' || item.length > 1000)) {
      throw new HttpsError('invalid-argument', `${field} has an invalid format.`);
    }
    return value.map(item => item.trim()).filter(Boolean);
  };
  const rawFaqs = input.faqs === undefined || input.faqs === null ? [] : input.faqs;
  if (!Array.isArray(rawFaqs) || rawFaqs.length > 30 || rawFaqs.some(item =>
    !item || typeof item !== 'object' ||
    typeof (item as Record<string, unknown>).question !== 'string' ||
    typeof (item as Record<string, unknown>).answer !== 'string' ||
    (item as Record<string, string>).question.length > 500 ||
    (item as Record<string, string>).answer.length > 2000)) {
    throw new HttpsError('invalid-argument', 'Event FAQs have an invalid format.');
  }
  const rawPrizes = input.prizes && typeof input.prizes === 'object' && !Array.isArray(input.prizes)
    ? input.prizes as Record<string, unknown>
    : {};
  const prizes: Record<string, string> = {};
  for (const key of ['first', 'second', 'third', 'special']) {
    const value = textField(rawPrizes[key]);
    if (value) prizes[key] = value.slice(0, 300);
  }
  if (!prizes.first) prizes.first = 'Trophy';

  return {
    title,
    slug,
    tagline: textField(input.tagline)?.slice(0, 220) || null,
    department_code: departmentCode,
    cluster_code: clusterCode || null,
    category,
    format,
    min_team_size: minTeamSize,
    max_team_size: maxTeamSize,
    fee,
    capacity,
    deadline,
    date_display: requiredText(input.date, 'Event date', 80),
    time_display: requiredText(input.time, 'Event time', 80),
    venue: requiredText(input.venue, 'Event venue', 240),
    description: requiredText(input.description, 'Event description', 5000),
    rules: arrayOfText(input.rules, 'Event rules', 100),
    prizes,
    eligibility: textField(input.eligibility)?.slice(0, 500) || 'All college delegates',
    coordinator_name: requiredText(input.coordinatorName, 'Coordinator name', 120),
    coordinator_phone: requiredText(input.coordinatorPhone, 'Coordinator phone', 40),
    coordinator_email: coordinatorEmail,
    banner_gradient: textField(input.bannerGradient)?.slice(0, 300) || null,
    payment_instructions: textField(input.paymentInstructions)?.slice(0, 500) || null,
    whatsapp_group_link: whatsappGroupLink,
    faqs: rawFaqs.map(item => ({
      question: (item as { question: string }).question.trim(),
      answer: (item as { answer: string }).answer.trim(),
    })).filter(item => item.question && item.answer),
  };
}

function toPublicProjection(id: string, event: Record<string, unknown>) {
  const publishable = event.status === 'open' && event.approval_status === 'approved' &&
    event.is_deleted !== true && !event.deleted_at;
  if (!publishable) return null;
  return {
    isPublished: true,
    id,
    slug: event.slug,
    title: event.title,
    tagline: event.tagline || '',
    departmentId: event.department_id || '',
    departmentCode: event.department_code,
    category: event.category,
    format: event.format,
    minTeamSize: event.min_team_size,
    maxTeamSize: event.max_team_size,
    fee: event.fee,
    capacity: event.capacity,
    registeredCount: event.registered_count,
    deadline: event.deadline ?? '',
    date: event.date_display,
    time: event.time_display,
    venue: event.venue,
    description: event.description,
    rules: Array.isArray(event.rules) ? event.rules : [],
    prizes: event.prizes,
    eligibility: event.eligibility,
    coordinatorName: event.coordinator_name,
    coordinatorPhone: event.coordinator_phone,
    coordinatorEmail: event.coordinator_email,
    status: 'open',
    faqs: Array.isArray(event.faqs) ? event.faqs : [],
    approvalStatus: 'approved',
  };
}

function canManageEvent(context: StaffContext, eventId: string, event: Record<string, unknown>): boolean {
  if (GLOBAL_ROLES.has(context.role)) return true;
  if (!DEPARTMENT_ROLES.has(context.role)) return false;
  return canReadStaffEvent(context.roleRecord, eventId, event, new Set(context.assignedEventIds));
}

export const createStaffEvent = onCall({ enforceAppCheck: false }, async request => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in with an authorized staff account.');
  const context = await loadStaffContext(uid, request.auth?.token?.email);
  const input = request.data?.event;
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpsError('invalid-argument', 'Event details are required.');
  if (!GLOBAL_ROLES.has(context.role) && !DEPARTMENT_ROLES.has(context.role)) {
    throw new HttpsError('permission-denied', 'Only a global or department coordinator can create an event.');
  }
  const requestedDepartment = textField((input as Record<string, unknown>).departmentCode)?.toUpperCase();
  const departmentCode = GLOBAL_ROLES.has(context.role) ? requestedDepartment : context.departmentCode;
  if (!departmentCode || (!GLOBAL_ROLES.has(context.role) && requestedDepartment && requestedDepartment !== departmentCode)) {
    throw new HttpsError('permission-denied', 'You cannot create an event outside your department.');
  }
  const requestedCluster = textField((input as Record<string, unknown>).clusterCode)?.toUpperCase();
  const clusterCode = GLOBAL_ROLES.has(context.role) ? requestedCluster : context.clusterCode;
  if (departmentCode === 'CSE' && (!clusterCode || !CSE_CLUSTERS.has(clusterCode))) {
    throw new HttpsError('failed-precondition', 'Choose an assigned CSE cluster before creating the event.');
  }
  if (departmentCode !== 'CSE' && clusterCode) throw new HttpsError('invalid-argument', 'Only CSE events may have a cluster.');

  const fields = validateEventFields(input as Record<string, unknown>, departmentCode, clusterCode);
  const eventId = randomUUID();
  const isGlobal = GLOBAL_ROLES.has(context.role);
  const requestedStatus = textField((input as Record<string, unknown>).status) || 'pending_approval';
  const status = isGlobal && EVENT_STATUSES.has(requestedStatus) ? requestedStatus : 'pending_approval';
  const requestedApproval = textField((input as Record<string, unknown>).approvalStatus);
  const approvalStatus = isGlobal && requestedApproval === 'approved' ? 'approved' : 'pending';
  const now = new Date().toISOString();
  const eventRef = context.db.collection('events').doc(eventId);
  const slugMatches = context.db.collection('events').where('slug', '==', fields.slug).limit(1);
  // A query alone cannot enforce uniqueness when two transactions create
  // different event documents with the same slug at the same time. The slug
  // claim is a deterministic document both transactions must read and write.
  const slugClaimRef = context.db.collection('eventSlugClaims').doc(fields.slug);
  const departmentMatches = context.db.collection('departments').where('code', '==', departmentCode).limit(1);
  await context.db.runTransaction(async transaction => {
    const [existing, slugClaim, departments] = await Promise.all([
      transaction.get(slugMatches),
      transaction.get(slugClaimRef),
      transaction.get(departmentMatches),
    ]);
    if (!existing.empty || slugClaim.exists) throw new HttpsError('already-exists', 'An event with this URL slug already exists.');
    if (departments.empty) throw new HttpsError('failed-precondition', 'The selected department is not configured in Firebase.');
    const event = {
      ...fields,
      department_id: departments.docs[0].id,
      registered_count: 0,
      status,
      approval_status: approvalStatus,
      is_deleted: false,
      deleted_at: null,
      created_at: now,
      updated_at: now,
    };
    transaction.create(eventRef, event);
    transaction.create(slugClaimRef, { event_id: eventId, slug: fields.slug, created_at: now });
    const projection = toPublicProjection(eventId, event);
    if (projection) transaction.set(context.db.collection('publicEvents').doc(eventId), projection);
  });
  const created = await eventRef.get();
  return { event: toStaffEvent(eventId, created.data() as Record<string, unknown>) };
});

export const updateStaffEvent = onCall({ enforceAppCheck: false }, async request => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in with an authorized staff account.');
  const eventId = textField(request.data?.eventId);
  const input = request.data?.event;
  if (!eventId || !EVENT_ID_PATTERN.test(eventId) || !input || typeof input !== 'object' || Array.isArray(input)) {
    throw new HttpsError('invalid-argument', 'A valid event ID and event changes are required.');
  }
  const context = await loadStaffContext(uid, request.auth?.token?.email);
  const patchInput = input as Record<string, unknown>;
  if (patchInput.id || patchInput.registeredCount !== undefined || patchInput.approvalStatus !== undefined ||
      patchInput.departmentCode !== undefined || patchInput.clusterCode !== undefined) {
    throw new HttpsError('invalid-argument', 'Event identity, registration count, approval, department, and cluster are server-managed.');
  }
  const patch: Record<string, unknown> = {};
  if (GLOBAL_ROLES.has(context.role) && Object.hasOwn(patchInput, 'status')) {
    const status = textField(patchInput.status);
    if (!status || !EVENT_STATUSES.has(status)) throw new HttpsError('invalid-argument', 'Choose a supported event status.');
    patch.status = status;
  }
  const updateTime = new Date().toISOString();
  patch.updated_at = updateTime;
  const eventRef = context.db.collection('events').doc(eventId);
  const projectionRef = context.db.collection('publicEvents').doc(eventId);
  await context.db.runTransaction(async transaction => {
    const snapshot = await transaction.get(eventRef);
    if (!snapshot.exists) throw new HttpsError('not-found', 'The event was not found.');
    const current = snapshot.data() as Record<string, unknown>;
    if (!canManageEvent(context, eventId, current)) throw new HttpsError('permission-denied', 'This account cannot edit this event.');
    if (!GLOBAL_ROLES.has(context.role) && Object.hasOwn(patchInput, 'status') && patchInput.status !== current.status) {
      throw new HttpsError('permission-denied', 'Department coordinators cannot publish or close events.');
    }
    const requestedFormat = textField(patchInput.format)?.toLowerCase();
    const requestedMin = patchInput.minTeamSize === undefined ? current.min_team_size : Number(patchInput.minTeamSize);
    const requestedMax = patchInput.maxTeamSize === undefined ? current.max_team_size : Number(patchInput.maxTeamSize);
    if ((requestedFormat && requestedFormat !== current.format) || requestedMin !== Number(current.min_team_size) || requestedMax !== Number(current.max_team_size)) {
      throw new HttpsError('failed-precondition', 'Changing event format or team-size rules requires a dedicated roster migration.');
    }
    const currentDeadline = current.deadline && typeof current.deadline === 'object' && 'toDate' in current.deadline
      ? (current.deadline as { toDate: () => Date }).toDate().toISOString()
      : current.deadline;
    const completeInput: Record<string, unknown> = {
      title: current.title,
      slug: current.slug,
      tagline: current.tagline,
      category: current.category,
      format: current.format,
      minTeamSize: current.min_team_size,
      maxTeamSize: current.max_team_size,
      fee: current.fee,
      capacity: current.capacity,
      deadline: currentDeadline,
      date: current.date_display,
      time: current.time_display,
      venue: current.venue,
      description: current.description,
      rules: current.rules,
      prizes: current.prizes,
      eligibility: current.eligibility,
      coordinatorName: current.coordinator_name,
      coordinatorPhone: current.coordinator_phone,
      coordinatorEmail: current.coordinator_email,
      bannerGradient: current.banner_gradient,
      paymentInstructions: current.payment_instructions,
      whatsappGroupLink: current.whatsapp_group_link,
      faqs: current.faqs,
      ...patchInput,
    };
    const validated = validateEventFields(completeInput, String(current.department_code || ''), textField(current.cluster_code)?.toUpperCase());
    for (const [frontKey, dbKey] of EVENT_EDIT_FIELDS) {
      if (Object.hasOwn(patchInput, frontKey)) patch[dbKey] = validated[dbKey as keyof typeof validated];
    }
    patch.updated_at = updateTime;
    if (patch.slug && patch.slug !== current.slug) {
      const nextClaimRef = context.db.collection('eventSlugClaims').doc(String(patch.slug));
      const [matches, nextClaim] = await Promise.all([
        transaction.get(context.db.collection('events').where('slug', '==', patch.slug).limit(2)),
        transaction.get(nextClaimRef),
      ]);
      if (matches.docs.some(match => match.id !== eventId) ||
          (nextClaim.exists && nextClaim.data()?.event_id !== eventId)) {
        throw new HttpsError('already-exists', 'An event with this URL slug already exists.');
      }
      if (!nextClaim.exists) transaction.create(nextClaimRef, {
        event_id: eventId,
        slug: patch.slug,
        created_at: new Date().toISOString(),
      });
    }
    const updated = { ...current, ...patch };
    transaction.update(eventRef, patch);
    const projection = toPublicProjection(eventId, updated);
    if (projection) transaction.set(projectionRef, projection);
    else transaction.delete(projectionRef);
  });
  const refreshed = await eventRef.get();
  return { event: toStaffEvent(eventId, refreshed.data() as Record<string, unknown>) };
});

export const approveStaffEvent = onCall({ enforceAppCheck: false }, async request => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in with an authorized staff account.');
  const eventId = textField(request.data?.eventId);
  if (!eventId || !EVENT_ID_PATTERN.test(eventId)) throw new HttpsError('invalid-argument', 'A valid event ID is required.');
  const context = await loadStaffContext(uid, request.auth?.token?.email);
  if (!GLOBAL_ROLES.has(context.role)) throw new HttpsError('permission-denied', 'Only central administrators can approve events.');
  const eventRef = context.db.collection('events').doc(eventId);
  const projectionRef = context.db.collection('publicEvents').doc(eventId);
  await context.db.runTransaction(async transaction => {
    const snapshot = await transaction.get(eventRef);
    if (!snapshot.exists) throw new HttpsError('not-found', 'The event was not found.');
    const current = snapshot.data() as Record<string, unknown>;
    if (current.is_deleted === true || current.deleted_at) throw new HttpsError('failed-precondition', 'A deleted event cannot be approved.');
    const updated = { ...current, approval_status: 'approved', status: current.status === 'pending_approval' ? 'open' : current.status, updated_at: new Date().toISOString() };
    transaction.update(eventRef, { approval_status: updated.approval_status, status: updated.status, updated_at: updated.updated_at });
    const projection = toPublicProjection(eventId, updated);
    if (projection) transaction.set(projectionRef, projection);
    else transaction.delete(projectionRef);
  });
  return { success: true };
});

const EVENT_DELETE_SCAN_LIMIT = 2000;
const EVENT_DELETE_BATCH_SIZE = 450;

async function collectByField(
  db: FirebaseFirestore.Firestore,
  collectionName: string,
  field: string,
  value: string,
): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> {
  const collected: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  let cursor: FirebaseFirestore.DocumentSnapshot | undefined;
  while (collected.length < EVENT_DELETE_SCAN_LIMIT) {
    const pageSize = Math.min(400, EVENT_DELETE_SCAN_LIMIT - collected.length + 1);
    let query: FirebaseFirestore.Query = db.collection(collectionName).where(field, '==', value).limit(pageSize);
    if (cursor) query = query.startAfter(cursor);
    const snapshot = await query.get();
    if (snapshot.docs.length > EVENT_DELETE_SCAN_LIMIT - collected.length) {
      throw new HttpsError('resource-exhausted', 'This event has too many linked records to delete at once. Contact the fest desk.');
    }
    collected.push(...snapshot.docs);
    if (snapshot.docs.length < pageSize) break;
    cursor = snapshot.docs[snapshot.docs.length - 1];
  }
  return collected;
}

async function collectByFieldIn(
  db: FirebaseFirestore.Firestore,
  collectionName: string,
  field: string,
  values: string[],
): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> {
  const collected: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  const unique = [...new Set(values.filter(Boolean))];
  for (let index = 0; index < unique.length; index += 10) {
    const snapshot = await db.collection(collectionName).where(field, 'in', unique.slice(index, index + 10)).limit(500).get();
    collected.push(...snapshot.docs);
  }
  return collected;
}

async function deleteDocumentRefs(
  db: FirebaseFirestore.Firestore,
  refs: FirebaseFirestore.DocumentReference[],
): Promise<number> {
  const unique = [...new Map(refs.map(ref => [ref.path, ref])).values()];
  for (let index = 0; index < unique.length; index += EVENT_DELETE_BATCH_SIZE) {
    const batch = db.batch();
    unique.slice(index, index + EVENT_DELETE_BATCH_SIZE).forEach(ref => batch.delete(ref));
    await batch.commit();
  }
  return unique.length;
}

function eventIdsFromPaymentOrder(data: Record<string, unknown>): string[] {
  const ids = new Set<string>();
  const direct = textField(data.event_id);
  if (direct) ids.add(direct);
  const payload = data.payload && typeof data.payload === 'object' && !Array.isArray(data.payload)
    ? data.payload as Record<string, unknown>
    : {};
  const payloadIds = Array.isArray(payload.eventIds) ? payload.eventIds : [];
  payloadIds.forEach(id => { if (typeof id === 'string') ids.add(id); });
  const items = Array.isArray(payload.items) ? payload.items : [];
  items.forEach(item => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const itemEventId = textField((item as Record<string, unknown>).eventId);
      if (itemEventId) ids.add(itemEventId);
    }
  });
  return [...ids];
}

export const deleteStaffEvent = onCall({ enforceAppCheck: false }, async request => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in with an authorized staff account.');
  const eventId = textField(request.data?.eventId);
  if (!eventId || !EVENT_ID_PATTERN.test(eventId)) throw new HttpsError('invalid-argument', 'A valid event ID is required.');
  const context = await loadStaffContext(uid, request.auth?.token?.email);
  const db = context.db;
  const eventRef = db.collection('events').doc(eventId);
  const eventSnapshot = await eventRef.get();
  if (!eventSnapshot.exists) throw new HttpsError('not-found', 'The event was not found.');
  const current = eventSnapshot.data() as Record<string, unknown>;
  if (!canManageEvent(context, eventId, current)) throw new HttpsError('permission-denied', 'This account cannot delete this event.');

  // Gather every dependent record before writing anything. A Razorpay order
  // with a captured payment (or an unresolved refund) must be reconciled by
  // the finance team first; deleting it would destroy the payment audit trail.
  const [registrationDocs, teamDocs, rollClaimDocs, assignmentDocs, directOrderDocs, recentOrderDocs] = await Promise.all([
    collectByField(db, 'registrations', 'event_id', eventId),
    collectByField(db, 'teams', 'event_id', eventId),
    collectByField(db, 'registrationRollClaims', 'event_id', eventId),
    collectByField(db, 'adminEventAssignments', 'event_id', eventId),
    collectByField(db, 'paymentOrders', 'event_id', eventId),
    db.collection('paymentOrders').orderBy('created_at', 'desc').limit(500).get().then(snapshot => snapshot.docs),
  ]);

  const orderDocs = [...new Map([...directOrderDocs, ...recentOrderDocs]
    .filter(doc => eventIdsFromPaymentOrder(doc.data() as Record<string, unknown>).includes(eventId))
    .map(doc => [doc.id, doc])).values()];
  const unresolvedOrders = orderDocs.filter(doc => {
    const data = doc.data() as Record<string, unknown>;
    const status = textField(data.status) || '';
    const refundStatus = textField(data.refund_status) || 'not_requested';
    const hasCapture = Boolean(textField(data.razorpay_payment_id));
    return refundStatus !== 'succeeded' &&
      (['paid', 'completed', 'captured'].includes(status) || hasCapture || refundStatus === 'pending' || refundStatus === 'failed');
  });
  if (unresolvedOrders.length) {
    throw new HttpsError('failed-precondition', 'This event has Razorpay payment history that must be reconciled before it can be deleted. Ask the finance team to review it first.');
  }

  const registrationIds = registrationDocs.map(doc => doc.id);
  const [emailDocs, memberDocs, displayClaimDocs, tokenClaimDocs] = await Promise.all([
    collectByFieldIn(db, 'emailDeliveries', 'registration_id', registrationIds),
    collectByFieldIn(db, 'registrationMembers', 'registration_id', registrationIds),
    collectByFieldIn(db, 'registrationDisplayClaims', 'registration_id', registrationIds),
    collectByFieldIn(db, 'ticketTokenClaims', 'registration_id', registrationIds),
  ]);
  const checkoutDocs = await collectByFieldIn(
    db, 'paymentCheckoutRequests', 'order_id', orderDocs.map(doc => doc.id),
  );
  const teamCodeRefs = teamDocs
    .map(doc => {
      const data = doc.data() as Record<string, unknown>;
      const code = textField(data.lookup_team_code) || normalizeRegistrationTeamCode(textField(data.team_code) || '');
      return code ? db.collection('teamCodeClaims').doc(code) : null;
    })
    .filter((ref): ref is FirebaseFirestore.DocumentReference => Boolean(ref));
  const gatewayOrderIds = [...new Set(orderDocs
    .map(doc => textField(doc.get('razorpay_order_id')))
    .filter((id): id is string => Boolean(id)))];
  const razorpayClaimRefs = gatewayOrderIds.map(id => db.collection('razorpayOrderClaims').doc(id));

  const now = new Date().toISOString();
  const slug = textField(current.slug);
  const projectionRef = db.collection('publicEvents').doc(eventId);
  const slugClaimRef = slug ? db.collection('eventSlugClaims').doc(slug) : null;

  // Hide the event first so no new registration or checkout can be created
  // while the dependent records are being removed. This update is idempotent,
  // so an interrupted cleanup can be retried by clicking Delete again.
  await db.runTransaction(async transaction => {
    const freshSnapshot = await transaction.get(eventRef);
    if (!freshSnapshot.exists) throw new HttpsError('not-found', 'The event was not found.');
    const fresh = freshSnapshot.data() as Record<string, unknown>;
    if (!canManageEvent(context, eventId, fresh)) throw new HttpsError('permission-denied', 'This account cannot delete this event.');
    if (fresh.is_deleted !== true && !fresh.deleted_at) {
      transaction.update(eventRef, {
        is_deleted: true, deleted_at: now, status: 'closed', registered_count: 0, updated_at: now,
      });
    }
    transaction.delete(projectionRef);
    if (slugClaimRef) transaction.delete(slugClaimRef);
    assignmentDocs.forEach(doc => transaction.delete(doc.ref));
  });

  const childRefs: FirebaseFirestore.DocumentReference[] = [
    ...registrationDocs.map(doc => doc.ref),
    ...registrationIds.map(id => db.collection('tickets').doc(id)),
    ...emailDocs.map(doc => doc.ref),
    ...memberDocs.map(doc => doc.ref),
    ...displayClaimDocs.map(doc => doc.ref),
    ...tokenClaimDocs.map(doc => doc.ref),
    ...rollClaimDocs.map(doc => doc.ref),
    ...teamDocs.map(doc => doc.ref),
    ...teamCodeRefs,
    ...orderDocs.map(doc => doc.ref),
    ...checkoutDocs.map(doc => doc.ref),
    ...razorpayClaimRefs,
  ];
  const documentsDeleted = await deleteDocumentRefs(db, childRefs);

  await db.collection('auditLogs').doc(randomUUID()).set({
    action: 'staff_event_deleted',
    actor_uid: uid,
    actor_role: context.role,
    event_id: eventId,
    event_title: textField(current.title) || '',
    registrations_deleted: registrationIds.length,
    documents_deleted: documentsDeleted,
    created_at: now,
  });

  return { success: true, deleted: true, registrationsDeleted: registrationIds.length, documentsDeleted };
});
