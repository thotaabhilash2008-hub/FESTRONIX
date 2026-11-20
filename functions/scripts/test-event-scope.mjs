import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { canReadStaffEvent, toStaffEvent } = require('../lib/eventAccess.js');
const eventId = '11111111-1111-4111-8111-111111111111';
const event = {
  department_code: 'CSE',
  cluster_code: 'CSE-3',
  is_deleted: false,
};

assert.equal(canReadStaffEvent(
  { role: 'dept_coordinator', department_code: 'CSE', cluster_code: 'CSE-3', active: true },
  eventId,
  event,
  new Set(),
), true, 'the assigned department cluster can read the event');

assert.equal(canReadStaffEvent(
  { role: 'dept_coordinator', department_code: 'CSE', cluster_code: 'CSE-2', active: true },
  eventId,
  event,
  new Set(),
), false, 'a different CSE cluster cannot read the event');

assert.equal(canReadStaffEvent(
  { role: 'dept_coordinator', department_code: 'IT', active: true },
  eventId,
  event,
  new Set(),
), false, 'another department cannot read the event');

assert.equal(canReadStaffEvent(
  { role: 'event_coordinator', department_code: 'CSE', cluster_code: 'CSE-3', active: true },
  eventId,
  event,
  new Set(),
), false, 'an event coordinator without an explicit assignment is denied');

assert.equal(canReadStaffEvent(
  { role: 'event_coordinator', department_code: 'CSE', cluster_code: 'CSE-3', active: true },
  eventId,
  event,
  new Set([eventId]),
), true, 'the explicitly assigned event coordinator can read the event');

assert.equal(canReadStaffEvent(
  { role: 'dean_sac', active: true },
  eventId,
  event,
  new Set(),
), true, 'a global administrator can read the event');

assert.equal(canReadStaffEvent(
  { role: 'super_admin', active: false },
  eventId,
  event,
  new Set(),
), false, 'inactive roles are denied');

assert.equal(canReadStaffEvent(
  { role: 'dept_coordinator', department_code: 'CSE', cluster_code: 'CSE-3', active: true },
  eventId,
  { ...event, is_deleted: true },
  new Set(),
), false, 'deleted events are denied');

const responseEvent = toStaffEvent(eventId, {
  ...event,
  title: 'Robotics',
  fee: 150,
  rules: ['Bring college ID'],
  prizes: { first: 'Trophy' },
  internal_secret: 'must not be returned',
});
assert.equal(responseEvent.id, eventId);
assert.equal(responseEvent.title, 'Robotics');
assert.equal('internal_secret' in responseEvent, false, 'unrecognized internal fields are not serialized');

console.log('Firebase staff event scope checks passed (8 cases).');
