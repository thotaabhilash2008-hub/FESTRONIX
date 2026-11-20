import assert from 'node:assert/strict';
import { buildRegistrationRollClaims } from '../lib/registrationRollClaims.mjs';

const claimSecret = 'test-only-registration-claim-secret-32-bytes';
const teamClaims = buildRegistrationRollClaims([
  { id: 'leader-reg', event_id: 'event-a', leader_roll: ' VCE001 ', team_code: 'FX-TEAM-1', payment_status: 'verified' },
  { id: 'member-reg', event_id: 'event-a', leader_roll: 'vce002', team_code: 'FX-TEAM-1', payment_status: 'verified' },
  { id: 'rejected-reg', event_id: 'event-a', leader_roll: 'VCE003', team_code: null, payment_status: 'rejected' },
  { id: 'other-event-reg', event_id: 'event-b', leader_roll: 'VCE001', team_code: null, payment_status: 'verified' },
], [
  { registration_id: 'leader-reg', roll_number: 'VCE002' },
], claimSecret);

assert.equal(teamClaims.length, 3, 'same-team mirrored participant rows merge, rejected rows are excluded, event scopes differ');
assert(teamClaims.every(claim => !JSON.stringify(claim.data).includes('VCE')),
  'derived claim document data does not contain raw roll numbers');
const memberClaim = teamClaims.find(claim => claim.data.registration_ids.includes('member-reg'));
assert(memberClaim);
assert.equal(memberClaim.data.conflict, false);
assert.deepEqual(memberClaim.data.registration_ids, ['leader-reg', 'member-reg']);

const collisionClaims = buildRegistrationRollClaims([
  { id: 'individual-1', event_id: 'event-c', leader_roll: 'same-roll', team_code: null, payment_status: 'verified' },
  { id: 'individual-2', event_id: 'event-c', leader_roll: 'SAME-ROLL', team_code: null, payment_status: 'not_applicable' },
  { id: 'different-team', event_id: 'event-c', leader_roll: 'OTHER', team_code: null, payment_status: 'verified' },
  { id: 'same-roll-other-team', event_id: 'event-c', leader_roll: 'same-roll', team_code: 'team-2', payment_status: 'verified' },
], [], claimSecret);
const conflictingClaim = collisionClaims.find(claim => claim.data.registration_ids.includes('individual-1'));
assert.equal(conflictingClaim.data.conflict, true, 'active duplicates across distinct registration groups are flagged');
assert.deepEqual(conflictingClaim.data.team_codes, ['TEAM2']);

assert.throws(() => buildRegistrationRollClaims(null, []), /must be arrays/);
assert.throws(() => buildRegistrationRollClaims([], [], 'short'), /at least 32 bytes/);
console.log('Registration roll claim tests passed (6 assertions).');
