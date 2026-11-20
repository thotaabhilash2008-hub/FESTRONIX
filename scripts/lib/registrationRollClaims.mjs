import { createHmac } from 'node:crypto';

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeRoll(value) {
  return clean(value).toUpperCase();
}

function normalizeTeamCode(value) {
  return clean(value).replace(/[^a-z0-9]/gi, '').toUpperCase();
}

function rollHash(eventId, roll, secret) {
  return createHmac('sha256', secret).update(`${eventId}\0${roll}`, 'utf8').digest('hex');
}

/**
 * Build private deterministic uniqueness claims for all active registrations.
 * Team members can appear both inside the leader's roster and as their own
 * registration row, so rows in the same event/team are merged into one claim.
 * The raw student roll number is never written to the derived claim document.
 */
export function buildRegistrationRollClaims(registrations, registrationMembers, secret) {
  if (!Array.isArray(registrations) || !Array.isArray(registrationMembers)) {
    throw new TypeError('Registration and member rows must be arrays.');
  }
  if (typeof secret !== 'string' || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new TypeError('A stable registration-claim HMAC secret of at least 32 bytes is required.');
  }

  const activeRegistrations = registrations.filter(row => row && row.payment_status !== 'rejected');
  const byId = new Map(activeRegistrations.map(row => [String(row.id || ''), row]));
  const claims = new Map();

  function add(registration, rawRoll) {
    const eventId = clean(registration?.event_id);
    const roll = normalizeRoll(rawRoll);
    if (!eventId || !roll) return;

    const hash = rollHash(eventId, roll, secret);
    const key = `${eventId}__${hash}`;
    let claim = claims.get(key);
    if (!claim) {
      claim = {
        id: key,
        data: {
          event_id: eventId,
          roll_hash: hash,
          registration_ids: [],
          team_codes: [],
          conflict: false,
        },
        _teamByRegistration: new Map(),
      };
      claims.set(key, claim);
    }

    const registrationId = clean(registration.id);
    if (registrationId && !claim.data.registration_ids.includes(registrationId)) {
      claim.data.registration_ids.push(registrationId);
    }
    const teamCode = normalizeTeamCode(registration.team_code);
    if (registrationId) {
      const registrationTeams = claim._teamByRegistration.get(registrationId) ?? new Set();
      if (teamCode) registrationTeams.add(teamCode);
      claim._teamByRegistration.set(registrationId, registrationTeams);
    }
  }

  for (const registration of activeRegistrations) add(registration, registration.leader_roll);
  for (const member of registrationMembers) {
    const registration = byId.get(String(member?.registration_id || ''));
    if (registration) add(registration, member.roll_number);
  }

  return [...claims.values()].map(claim => {
    const teamCodes = [...new Set(
      [...claim._teamByRegistration.values()].flatMap(teams => [...teams]),
    )].sort();
    const allRegistrationsShareOneTeam = teamCodes.length === 1 &&
      [...claim._teamByRegistration.values()].every(teams => teams.size === 1 && teams.has(teamCodes[0]));
    const hasConflictingRows = claim.data.registration_ids.length > 1 && !allRegistrationsShareOneTeam;
    return {
      id: claim.id,
      data: {
        ...claim.data,
        registration_ids: [...claim.data.registration_ids].sort(),
        team_codes: teamCodes,
        conflict: hasConflictingRows || teamCodes.length > 1,
      },
    };
  }).sort((left, right) => left.id.localeCompare(right.id));
}
