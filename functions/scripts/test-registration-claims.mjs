import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { buildRegistrationRollClaims } from '../../scripts/lib/registrationRollClaims.mjs';

const require = createRequire(import.meta.url);
const { normalizeRegistrationRoll, normalizeRegistrationTeamCode, registrationRollClaimId } = require('../lib/registrationClaims.js');
const secret = 'integration-test-registration-claim-secret';
const eventId = 'event-123';
const roll = ' vcecs001 ';

assert.equal(normalizeRegistrationRoll(roll), 'VCECS001');
assert.equal(normalizeRegistrationTeamCode('FX-CSE-001'), 'FXCSE001');
const migrated = buildRegistrationRollClaims([
  { id: 'registration-1', event_id: eventId, leader_roll: roll, payment_status: 'verified' },
], [], secret);
assert.equal(registrationRollClaimId(eventId, roll, secret), migrated[0].id,
  'runtime claim IDs match the migration transformer');
assert.notEqual(registrationRollClaimId('another-event', roll, secret), migrated[0].id,
  'the same roll number has a separate event-scoped claim');
assert.throws(() => registrationRollClaimId(eventId, roll, 'short'), /at least 32 bytes/);

console.log('Firebase registration claim parity checks passed (5 assertions).');
