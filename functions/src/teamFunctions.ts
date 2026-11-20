import { createHmac } from 'node:crypto';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { normalizeRegistrationRoll, normalizeRegistrationTeamCode } from './registrationClaims';

const ROLL_CLAIM_SECRET = defineSecret('REGISTRATION_ROLL_CLAIM_SECRET');

type AnyRecord = Record<string, unknown>;

function clean(value: unknown, max = 1000): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function requirePublicRateLimit(request: { rawRequest: { ip?: string; get(name: string): string | undefined } }, action: string, limit: number): Promise<void> {
  const ip = clean(request.rawRequest.ip || request.rawRequest.get('x-forwarded-for')?.split(',')[0], 100);
  if (!ip) throw new HttpsError('resource-exhausted', 'This request could not be safely rate-limited. Try again from a normal browser connection.');
  const minute = Math.floor(Date.now() / 60_000);
  const key = createHmac('sha256', ROLL_CLAIM_SECRET.value()).update(`team:${action}\0${ip}\0${minute}`).digest('hex');
  const ref = getFirestore().collection('publicRateLimits').doc(`team_${key}`);
  const allowed = await getFirestore().runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    const count = Number(snapshot.get('count') || 0) + 1;
    if (count > limit) return false;
    transaction.set(ref, { count, expires_at: Timestamp.fromMillis((minute + 10) * 60_000) });
    return true;
  });
  if (!allowed) throw new HttpsError('resource-exhausted', 'Too many team requests. Wait a minute and try again.');
}

async function resolveEvent(db: FirebaseFirestore.Firestore, eventRef: string) {
  const direct = await db.collection('events').doc(eventRef).get();
  if (direct.exists) return direct;
  const matches = await db.collection('events').where('slug', '==', eventRef).limit(2).get();
  if (matches.size > 1) throw new HttpsError('failed-precondition', 'The event URL is duplicated. Contact the fest desk.');
  return matches.docs[0] || null;
}

async function findTeam(db: FirebaseFirestore.Firestore, code: unknown) {
  const normalized = normalizeRegistrationTeamCode(code);
  if (normalized.length < 6 || normalized.length > 40) throw new HttpsError('invalid-argument', 'Enter a valid team code.');
  const matches = await db.collection('teams').where('lookup_team_code', '==', normalized).limit(2).get();
  if (matches.size > 1) throw new HttpsError('failed-precondition', 'This team code is duplicated in the database. Contact the fest desk.');
  if (matches.size === 1) return matches.docs[0];

  // Support older imported documents created before lookup fields were added.
  const legacyCode = clean(code, 40).toUpperCase();
  const legacy = await db.collection('teams').where('team_code', '==', legacyCode).limit(2).get();
  if (legacy.size > 1) throw new HttpsError('failed-precondition', 'This team code is duplicated in the database. Contact the fest desk.');
  return legacy.docs[0] || null;
}

function safeRosterMember(value: AnyRecord, status?: AnyRecord) {
  return {
    name: clean(value.name, 120),
    rollNumber: normalizeRegistrationRoll(value.rollNumber ?? value.roll_number),
    joinedViaInvite: value.joined_via_invite === true || value.joinedViaInvite === true,
    registrationStatus: clean(status?.payment_status, 40) || 'membership_pending',
    qrGenerated: Boolean(clean(status?.qr_token, 200)),
    registeredAt: clean(status?.created_at, 80) || undefined,
  };
}

async function dashboardSnapshot(teamId: string, team: AnyRecord): Promise<AnyRecord> {
  const db = getFirestore();
  const eventRef = clean(team.event_id, 160);
  const eventSnapshot = await resolveEvent(db, eventRef);
  const eventId = eventSnapshot?.id || eventRef;
  const code = clean(team.team_code, 40);
  const registrations = await db.collection('registrations').where('team_code', '==', code).limit(100).get();
  const registrationsByRoll = new Map<string, AnyRecord>();
  for (const document of registrations.docs) {
    const row = document.data();
    const roll = normalizeRegistrationRoll(row.leader_roll);
    if (roll) registrationsByRoll.set(roll, row);
  }
  const leaderRoll = normalizeRegistrationRoll(team.leader_roll);
  const leaderRegistration = registrationsByRoll.get(leaderRoll);
  const event = eventSnapshot?.data() || {};
  const paymentStatus = Number(event.fee || 0) === 0 ? 'not_applicable' : clean(leaderRegistration?.payment_status, 40) || 'payment_required';
  const members = Array.isArray(team.members) ? team.members.filter(item => item && typeof item === 'object').map(item => {
    const member = item as AnyRecord;
    return safeRosterMember(member, registrationsByRoll.get(normalizeRegistrationRoll(member.rollNumber ?? member.roll_number)));
  }) : [];
  return {
    id: teamId,
    teamCode: code,
    teamName: clean(team.team_name, 120),
    eventId,
    eventTitle: clean(team.event_title, 140) || clean(event.title, 140),
    registrationId: clean(team.registration_id, 120),
    leaderName: clean(team.leader_name, 120),
    leaderRoll,
    leaderEmail: '',
    leaderPhone: '',
    leaderCollege: clean(team.leader_college, 180),
    members,
    memberCount: members.length,
    totalMemberCount: members.length + 1,
    maxTeamSize: Number(team.max_team_size) || Number(event.max_team_size) || 4,
    minTeamSize: Number(team.min_team_size) || Number(event.min_team_size) || 2,
    paymentStatus,
    leaderRegistrationStatus: clean(leaderRegistration?.payment_status, 40) || 'membership_pending',
    leaderQrGenerated: Boolean(clean(leaderRegistration?.qr_token, 200)),
    createdAt: clean(team.created_at, 80) || new Date().toISOString(),
    updatedAt: clean(team.updated_at, 80) || undefined,
    isCurrentUserLeader: false,
    isCurrentUserMember: false,
  };
}

export const findPublicTeam = onCall({ region: 'asia-south1', secrets: [ROLL_CLAIM_SECRET] }, async request => {
  await requirePublicRateLimit(request, 'lookup', 180);
  const team = await findTeam(getFirestore(), request.data?.teamCode);
  if (!team) return { success: false, error: 'Team not found.' };
  const result = await dashboardSnapshot(team.id, team.data());
  const requestedEvent = clean(request.data?.eventId, 160);
  if (requestedEvent) {
    const eventSnapshot = await resolveEvent(getFirestore(), requestedEvent);
    if (!eventSnapshot || eventSnapshot.id !== result.eventId) {
      return { success: false, error: 'This team belongs to a different event.' };
    }
  }
  return { success: true, team: result };
});
