import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
const functionsHost = process.env.FUNCTIONS_EMULATOR_HOST || '127.0.0.1:5001';
const region = 'asia-south1';
const cse3EventId = '11111111-1111-4111-8111-111111111111';
const cse2EventId = '22222222-2222-4222-8222-222222222222';
const civilEventId = '33333333-3333-4333-8333-333333333333';

if (!projectId || !authHost || !firestoreHost) {
  throw new Error('Run this script through Firebase Auth, Firestore, and Functions emulators.');
}

const app = initializeApp({ projectId }, `staff-scope-check-${Date.now()}`);
const auth = getAuth(app);
const db = getFirestore(app);
const cases = [];

async function createStaff(roleRecords, assignments = []) {
  const email = `scope-${crypto.randomUUID()}@example.test`;
  const user = await auth.createUser({ email, password: 'Local-only-Test-Password-123!' });
  for (const [index, role] of roleRecords.entries()) {
    await db.collection('adminRoles').doc(`${user.uid}-${index}`).set({
      user_id: user.uid,
      active: true,
      ...role,
    });
  }
  for (const [index, eventId] of assignments.entries()) {
    await db.collection('adminEventAssignments').doc(`${user.uid}-${index}`).set({
      admin_user_id: user.uid,
      event_id: eventId,
    });
  }
  return { email, uid: user.uid };
}

async function invokeCallable(functionName, user, expectedStatus = 200, { disableAfterSignIn = false, data = {} } = {}) {
  const authResponse = await fetch(
    `http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=emulator-key`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: 'Local-only-Test-Password-123!', returnSecureToken: true }),
    },
  );
  assert.equal(authResponse.status, 200, 'Auth emulator sign-in should work for the fixture.');
  const { idToken } = await authResponse.json();
  if (disableAfterSignIn) await auth.updateUser(user.uid, { disabled: true });

  const response = await fetch(`http://${functionsHost}/${projectId}/${region}/${functionName}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${idToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ data }),
  });
  const result = await response.json();
  if (expectedStatus !== null) {
    assert.equal(response.status, expectedStatus, `Unexpected callable response: ${JSON.stringify(result)}`);
  }
  return { httpStatus: response.status, ...result };
}

async function invoke(user, expectedStatus = 200, options = {}) {
  return invokeCallable('getStaffAccess', user, expectedStatus, options);
}

async function invokeWithoutAuth(functionName = 'getStaffAccess', data = {}) {
  const response = await fetch(`http://${functionsHost}/${projectId}/${region}/${functionName}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ data }),
  });
  const result = await response.json();
  assert.equal(response.status, 401, `Unauthenticated callable should be rejected: ${JSON.stringify(result)}`);
  assert.equal(result.error?.status, 'UNAUTHENTICATED');
}

try {
  await db.collection('departments').doc('00000000-0000-4000-8000-000000000001').set({ code: 'CSE', name: 'Computer Science and Engineering' });
  await db.collection('departments').doc('00000000-0000-4000-8000-000000000002').set({ code: 'CIVIL', name: 'Civil Engineering' });
  await db.collection('events').doc(cse3EventId).set({
    title: 'CSE Cluster 3 Test Event', department_code: 'CSE', cluster_code: 'CSE-3',
    is_deleted: false, fee: 100, min_team_size: 1, max_team_size: 1, rules: [],
  });
  await db.collection('events').doc(cse2EventId).set({
    title: 'CSE Cluster 2 Test Event', department_code: 'CSE', cluster_code: 'CSE-2',
    is_deleted: false, fee: 100, min_team_size: 1, max_team_size: 1, rules: [],
  });
  await db.collection('events').doc(civilEventId).set({
    title: 'Civil Test Event', department_code: 'CIVIL', cluster_code: null,
    is_deleted: false, fee: 100, min_team_size: 1, max_team_size: 1, rules: [],
  });

  await invokeWithoutAuth();
  cases.push('unauthenticated callable request is denied');

  await invokeWithoutAuth('listStaffEvents');
  cases.push('unauthenticated event list request is denied');

  const departmentStaff = await createStaff([{
    role: 'dept_chief_coordinator',
    department_code: 'CSE',
    cluster_code: 'CSE-3',
  }]);

  const eventInput = (overrides = {}) => ({
    title: 'Firebase Department Event',
    slug: `firebase-department-${crypto.randomUUID().slice(0, 8)}`,
    departmentCode: 'CSE',
    clusterCode: 'CSE-3',
    category: 'technical',
    format: 'individual',
    minTeamSize: 1,
    maxTeamSize: 1,
    fee: 100,
    capacity: 50,
    deadline: '2026-12-01T18:30:00.000Z',
    date: 'Dec 2, 2026',
    time: '10:00 AM',
    venue: 'Main Auditorium',
    description: 'A test event created only in the local Firebase emulator.',
    rules: ['Bring college ID'],
    prizes: { first: 'Trophy' },
    eligibility: 'All students',
    coordinatorName: 'Test Coordinator',
    coordinatorPhone: '+919000000000',
    coordinatorEmail: 'coordinator@example.test',
    paymentInstructions: 'Test instructions',
    whatsappGroupLink: 'https://chat.whatsapp.com/AbCdEf0123456789012345',
    ...overrides,
  });
  const createdDepartmentResponse = await invokeCallable('createStaffEvent', departmentStaff, 200, { data: { event: eventInput() } });
  const createdDepartmentEvent = (createdDepartmentResponse.result ?? createdDepartmentResponse.data).event;
  assert.equal(createdDepartmentEvent.departmentCode, 'CSE');
  assert.equal(createdDepartmentEvent.clusterCode, 'CSE-3');
  assert.equal(createdDepartmentEvent.status, 'pending_approval');
  assert.equal(createdDepartmentEvent.approvalStatus, 'pending');
  const storedDepartmentEvent = await db.collection('events').doc(createdDepartmentEvent.id).get();
  assert.equal(storedDepartmentEvent.data().department_id, '00000000-0000-4000-8000-000000000001');
  assert.equal((await db.collection('publicEvents').doc(createdDepartmentEvent.id).get()).exists, false);
  cases.push('department event creation is stored privately with assigned department/cluster and awaits approval');

  const contestedSlug = `firebase-race-${crypto.randomUUID().slice(0, 8)}`;
  const concurrentCreates = await Promise.all([
    invokeCallable('createStaffEvent', departmentStaff, null, { data: { event: eventInput({ slug: contestedSlug }) } }),
    invokeCallable('createStaffEvent', departmentStaff, null, { data: { event: eventInput({ slug: contestedSlug }) } }),
  ]);
  assert.deepEqual(concurrentCreates.map(result => result.httpStatus).sort(), [200, 409]);
  const slugEvents = await db.collection('events').where('slug', '==', contestedSlug).get();
  assert.equal(slugEvents.size, 1);
  const slugClaim = await db.collection('eventSlugClaims').doc(contestedSlug).get();
  assert.equal(slugClaim.exists, true);
  assert.equal(slugClaim.data().event_id, slugEvents.docs[0].id);
  cases.push('concurrent duplicate event slugs are serialized by a Firestore claim');

  const crossDepartmentCreate = await invokeCallable('createStaffEvent', departmentStaff, 403, {
    data: { event: eventInput({ departmentCode: 'CIVIL', clusterCode: undefined }) },
  });
  assert.equal(crossDepartmentCreate.error?.status, 'PERMISSION_DENIED');
  const invalidWhatsAppLink = await invokeCallable('createStaffEvent', departmentStaff, 400, {
    data: { event: eventInput({ whatsappGroupLink: 'https://example.test/invite' }) },
  });
  assert.equal(invalidWhatsAppLink.error?.status, 'INVALID_ARGUMENT');
  cases.push('event creation rejects cross-department fields and untrusted WhatsApp link domains');
  const departmentResult = await invoke(departmentStaff);
  const departmentAccess = departmentResult.result ?? departmentResult.data;
  assert.equal(departmentAccess.user.role, 'dept_coordinator');
  assert.equal(departmentAccess.scope.kind, 'department');
  assert.equal(departmentAccess.scope.departmentCode, 'CSE');
  assert.equal(departmentAccess.scope.clusterCode, 'CSE-3');
  cases.push('department coordinator keeps exact CSE cluster scope');

  const departmentEventsResponse = await invokeCallable('listStaffEvents', departmentStaff);
  const departmentEvents = (departmentEventsResponse.result ?? departmentEventsResponse.data).events;
  assert(departmentEvents.some(event => event.id === cse3EventId));
  assert(!departmentEvents.some(event => event.id === cse2EventId));
  assert(departmentEvents.every(event => event.departmentCode === 'CSE' && event.clusterCode === 'CSE-3'));
  const departmentEventResponse = await invokeCallable('getStaffEvent', departmentStaff, 200, { data: { eventId: cse3EventId } });
  assert.equal((departmentEventResponse.result ?? departmentEventResponse.data).event.id, cse3EventId);
  const crossClusterResponse = await invokeCallable('getStaffEvent', departmentStaff, 403, { data: { eventId: cse2EventId } });
  assert.equal(crossClusterResponse.error?.status, 'PERMISSION_DENIED');
  cases.push('department coordinator event list and lookup are restricted to its CSE cluster');

  const missingClusterStaff = await createStaff([{
    role: 'dept_coordinator',
    department_code: 'CSE',
  }]);
  const missingClusterResult = await invoke(missingClusterStaff, 400);
  assert.equal(missingClusterResult.error?.status, 'FAILED_PRECONDITION');
  cases.push('CSE department coordinator without a cluster fails closed');

  const invalidClusterStaff = await createStaff([{
    role: 'dept_coordinator',
    department_code: 'CSE',
    cluster_code: 'CSE-4',
  }]);
  const invalidClusterResult = await invoke(invalidClusterStaff, 400);
  assert.equal(invalidClusterResult.error?.status, 'FAILED_PRECONDITION');
  cases.push('unknown CSE cluster fails closed');

  const eventStaff = await createStaff([{
    role: 'event_coordinator',
    department_code: 'CSE',
    cluster_code: 'CSE-3',
  }], [cse3EventId]);
  const eventRoleCreate = await invokeCallable('createStaffEvent', eventStaff, 403, { data: { event: eventInput() } });
  assert.equal(eventRoleCreate.error?.status, 'PERMISSION_DENIED');
  const eventRoleDelete = await invokeCallable('deleteStaffEvent', eventStaff, 403, { data: { eventId: createdDepartmentEvent.id } });
  assert.equal(eventRoleDelete.error?.status, 'PERMISSION_DENIED');
  cases.push('event coordinators cannot create or delete department events');
  const eventResult = await invoke(eventStaff);
  const eventAccess = eventResult.result ?? eventResult.data;
  assert.equal(eventAccess.scope.kind, 'assigned_events');
  assert.deepEqual(eventAccess.scope.eventIds, [cse3EventId]);
  assert.deepEqual(eventAccess.user.assignedEvents, [cse3EventId]);
  const eventListResponse = await invokeCallable('listStaffEvents', eventStaff);
  const eventList = (eventListResponse.result ?? eventListResponse.data).events;
  assert.deepEqual(eventList.map(event => event.id), [cse3EventId]);
  const assignedEventResponse = await invokeCallable('getStaffEvent', eventStaff, 200, { data: { eventId: cse3EventId } });
  assert.equal((assignedEventResponse.result ?? assignedEventResponse.data).event.id, cse3EventId);
  const unassignedEventResponse = await invokeCallable('getStaffEvent', eventStaff, 403, { data: { eventId: cse2EventId } });
  assert.equal(unassignedEventResponse.error?.status, 'PERMISSION_DENIED');
  cases.push('event coordinator sees explicit assignments only');

  const financeStaff = await createStaff([{ role: 'finance_reviewer' }]);
  const financeResult = await invoke(financeStaff);
  const financeAccess = financeResult.result ?? financeResult.data;
  assert.equal(financeAccess.scope.kind, 'central_operations');
  const financeEventsResponse = await invokeCallable('listStaffEvents', financeStaff);
  const financeEvents = (financeEventsResponse.result ?? financeEventsResponse.data).events;
  assert(financeEvents.length >= 3);
  assert([cse3EventId, cse2EventId, civilEventId].every(id => financeEvents.some(event => event.id === id)));
  cases.push('finance reviewer maps to central operations');

  const globalStaff = await createStaff([{ role: 'super_admin' }]);
  const createdApprovedResponse = await invokeCallable('createStaffEvent', globalStaff, 200, {
    data: { event: eventInput({ title: 'Global Approved Event', status: 'open', approvalStatus: 'approved' }) },
  });
  const createdApprovedEvent = (createdApprovedResponse.result ?? createdApprovedResponse.data).event;
  assert.equal(createdApprovedEvent.status, 'open');
  assert.equal(createdApprovedEvent.approvalStatus, 'approved');
  const publicEventSnapshot = await db.collection('publicEvents').doc(createdApprovedEvent.id).get();
  assert.equal(publicEventSnapshot.data().isPublished, true);
  assert.equal(Object.hasOwn(publicEventSnapshot.data(), 'whatsappGroupLink'), false);
  const departmentEditInput = eventInput({ title: 'Department Edited Event', slug: createdApprovedEvent.slug });
  delete departmentEditInput.departmentCode;
  delete departmentEditInput.clusterCode;
  const editApprovedResponse = await invokeCallable('updateStaffEvent', departmentStaff, 200, {
    data: { eventId: createdApprovedEvent.id, event: departmentEditInput },
  });
  assert.equal((editApprovedResponse.result ?? editApprovedResponse.data).event.title, 'Department Edited Event');
  const unauthorizedApproval = await invokeCallable('approveStaffEvent', departmentStaff, 403, { data: { eventId: createdDepartmentEvent.id } });
  assert.equal(unauthorizedApproval.error?.status, 'PERMISSION_DENIED');
  const clusterIsolatedEdit = await invokeCallable('updateStaffEvent', departmentStaff, 403, {
    data: { eventId: cse2EventId, event: { title: 'Cross cluster edit' } },
  });
  assert.equal(clusterIsolatedEdit.error?.status, 'PERMISSION_DENIED');
  const deleteApproved = await invokeCallable('deleteStaffEvent', departmentStaff, 200, { data: { eventId: createdApprovedEvent.id } });
  assert.equal((deleteApproved.result ?? deleteApproved.data).deleted, true);
  assert.equal((await db.collection('events').doc(createdApprovedEvent.id).get()).data().is_deleted, true);
  assert.equal((await db.collection('publicEvents').doc(createdApprovedEvent.id).get()).exists, false);
  cases.push('event approval, edits, department/cluster isolation, and soft deletion synchronize the public projection');

  const noRoleStaff = await createStaff([]);
  const noRoleResult = await invoke(noRoleStaff, 403);
  assert.equal(noRoleResult.error?.status, 'PERMISSION_DENIED');
  cases.push('authenticated user without active role is denied');

  const duplicateRoleStaff = await createStaff([
    { role: 'dept_coordinator', department_code: 'CIVIL' },
    { role: 'dept_coordinator', department_code: 'MECH' },
  ]);
  const duplicateRoleResult = await invoke(duplicateRoleStaff, 400);
  assert.equal(duplicateRoleResult.error?.status, 'FAILED_PRECONDITION');
  cases.push('multiple active roles fail closed');

  const disabledStaff = await createStaff([{ role: 'super_admin' }]);
  const disabledResult = await invoke(disabledStaff, 403, { disableAfterSignIn: true });
  assert.equal(disabledResult.error?.status, 'PERMISSION_DENIED');
  cases.push('disabled Auth account is denied');

  console.log(`Staff access emulator checks passed (${cases.length} cases):`);
  for (const testCase of cases) console.log(`- ${testCase}`);
} finally {
  await deleteApp(app);
}
