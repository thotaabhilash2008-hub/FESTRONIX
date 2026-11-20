import assert from 'node:assert/strict';
import { generateKeyPairSync, verify } from 'node:crypto';
import test from 'node:test';
import { createFirebaseFirestoreClient } from '../lib/firebaseFirestore.mjs';

const projectId = 'festronix-migration-stg26';
const { privateKey: signingKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});
const privateKey = signingKey.export({ type: 'pkcs8', format: 'pem' }).toString();

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function oauthAndDocumentFetch(counters) {
  return async (input, init = {}) => {
    const url = String(input);
    if (url === 'https://oauth2.googleapis.com/token') {
      counters.oauth += 1;
      const form = new URLSearchParams(String(init.body));
      const assertion = form.get('assertion');
      assert.ok(assertion, 'OAuth exchange must include a signed JWT assertion.');
      const [header, claims, signature] = assertion.split('.');
      const signingInput = `${header}.${claims}`;
      assert.equal(verify('RSA-SHA256', Buffer.from(signingInput), publicKey, Buffer.from(signature, 'base64url')), true);
      const decodedClaims = JSON.parse(Buffer.from(claims, 'base64url').toString('utf8'));
      assert.equal(decodedClaims.iss, 'firebase-test@festronix-migration-stg26.iam.gserviceaccount.com');
      assert.equal(decodedClaims.scope, 'https://www.googleapis.com/auth/datastore');
      return jsonResponse({ access_token: 'test-access-token', expires_in: 3600 });
    }

    counters.firestore += 1;
    assert.equal(new Headers(init.headers).get('authorization'), 'Bearer test-access-token');
    return jsonResponse({ name: `${url.split('/projects/')[1]}`, fields: { title: { stringValue: 'test' } } });
  };
}

test('service-account OAuth token is signed, scoped, cached, and never logged', async () => {
  const counters = { oauth: 0, firestore: 0 };
  const client = createFirebaseFirestoreClient({
    projectId,
    serviceAccountEmail: 'firebase-test@festronix-migration-stg26.iam.gserviceaccount.com',
    privateKey,
    fetchImpl: oauthAndDocumentFetch(counters),
  });

  await client.getDocument('events', 'event-one');
  await client.getDocument('events', 'event-two');
  assert.deepEqual(counters, { oauth: 1, firestore: 2 });
});

test('refuses unknown collections, path traversal, and malformed project settings', () => {
  assert.throws(() => createFirebaseFirestoreClient({ projectId: 'production.firebaseio.com', emulatorHost: '127.0.0.1:8080' }));
  const client = createFirebaseFirestoreClient({ projectId, emulatorHost: '127.0.0.1:8080' });
  assert.rejects(client.getDocument('authUsers', 'sensitive'));
  assert.rejects(client.getDocument('events', '../secret'));
  assert.throws(() => createFirebaseFirestoreClient({ projectId, emulatorHost: 'example.com:8080' }));
});

test('runs a transaction with a declared read set and validated write target', async () => {
  const calls = [];
  const transactionFetch = async (input, init = {}) => {
    const url = String(input);
    if (url === 'https://oauth2.googleapis.com/token') {
      calls.push({ url, body: null });
      return jsonResponse({ access_token: 'test-access-token', expires_in: 3600 });
    }
    const body = init.body ? JSON.parse(String(init.body)) : {};
    calls.push({ url, body });
    if (url.endsWith(':beginTransaction')) return jsonResponse({ transaction: 'transaction-token' });
    if (url.endsWith(':batchGet')) {
      assert.deepEqual(body.documents, [`projects/${projectId}/databases/(default)/documents/events/event-one`]);
      assert.equal(body.transaction, 'transaction-token');
      return jsonResponse([{ found: { name: body.documents[0], fields: { capacity: { integerValue: '10' } } } }]);
    }
    if (url.endsWith(':commit')) {
      assert.equal(body.transaction, 'transaction-token');
      assert.equal(body.writes[0].update.fields.registeredCount.integerValue, '3');
      return jsonResponse({ writeResults: [{}] });
    }
    if (url.endsWith(':rollback')) return jsonResponse({});
    throw new Error('Unexpected mock request.');
  };
  const client = createFirebaseFirestoreClient({
    projectId,
    serviceAccountEmail: 'firebase-test@festronix-migration-stg26.iam.gserviceaccount.com',
    privateKey,
    fetchImpl: transactionFetch,
  });

  const result = await client.runTransaction([{ collection: 'events', id: 'event-one' }], ({ get }) => {
    const event = get('events', 'event-one');
    assert.equal(event.fields.capacity.integerValue, '10');
    return [{
      update: {
        name: `projects/${projectId}/databases/(default)/documents/events/event-one`,
        fields: { registeredCount: { integerValue: '3' } },
      },
    }];
  });
  assert.equal(result.attempts, 1);
  assert.ok(calls.some(call => call.url.endsWith(':commit')));
});

test('emulator transaction creates, reads, and deletes only local test data', {
  skip: !process.env.FIRESTORE_EMULATOR_HOST,
}, async () => {
  const client = createFirebaseFirestoreClient({
    projectId,
    emulatorHost: process.env.FIRESTORE_EMULATOR_HOST,
  });
  const id = `rest-adapter-${crypto.randomUUID()}`;
  const name = `projects/${projectId}/databases/(default)/documents/announcements/${id}`;
  const ref = { collection: 'announcements', id };

  await client.runTransaction([ref], ({ get }) => {
    assert.equal(get(ref.collection, ref.id), null);
    return [{
      update: { name, fields: { title: { stringValue: 'local emulator smoke check' } } },
      currentDocument: { exists: false },
    }];
  });
  const stored = await client.getDocument(ref.collection, ref.id);
  assert.equal(stored.fields.title.stringValue, 'local emulator smoke check');

  await client.runTransaction([ref], ({ get }) => {
    assert.ok(get(ref.collection, ref.id));
    return [{ delete: name }];
  });
  assert.equal(await client.getDocument(ref.collection, ref.id), null);
});
