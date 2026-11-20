import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ID = 'festronix-migration-stg26';
const EXPECTED_LOCATION = 'asia-south1';
const EXPORT_DIRECTORY = path.join(
  process.env.LOCALAPPDATA ?? '',
  'FestronixMigration',
  'supabase-export',
);
const EXPORT_MANIFEST_PATH = path.join(EXPORT_DIRECTORY, 'manifest.json');
const INPUT_PATH = path.join(EXPORT_DIRECTORY, 'firestore-import.ndjson');
const EXPORT_FILES = {
  schema: path.join(EXPORT_DIRECTORY, 'public-schema.sql'),
  data: path.join(EXPORT_DIRECTORY, 'public-data.sql'),
};
const ALLOWED_COLLECTIONS = new Set([
  'profiles',
  'departments',
  'adminRoles',
  'adminEventAssignments',
  'events',
  'publicEvents',
  'registrations',
  'registrationMembers',
  'registrationRollClaims',
  'tickets',
  'paymentProofs',
  'announcements',
  'auditLogs',
  'certificates',
  'sponsors',
  'sponsorProfiles',
  'teams',
  'paymentOrders',
  'emailDeliveries',
  'legacyOrphanTeams',
]);
const BATCH_SIZE = 100;
const PAGE_SIZE = 1000;

function parseArgs(args) {
  const options = { apply: false, refresh: false, deleteStale: false };
  for (const argument of args) {
    if (argument === '--apply') {
      options.apply = true;
      continue;
    }
    if (argument === '--refresh') {
      options.refresh = true;
      continue;
    }
    if (argument === '--delete-stale') {
      options.deleteStale = true;
      continue;
    }
    const match = argument.match(/^--(project|confirm-project|sha256|expected-account)=(.*)$/);
    if (match) {
      options[match[1]] = match[2];
      continue;
    }
    if (argument === '--help' || argument === '-h') {
      console.log([
        'Read-only preflight (default): node scripts/import-firestore-staging.mjs',
        'Apply: node scripts/import-firestore-staging.mjs --apply --project=festronix-migration-stg26 --confirm-project=festronix-migration-stg26 --sha256=<printed-input-hash> --expected-account=<Google-account-email>',
        'Refresh changed docs: add --refresh. Remove stale allowlisted docs only with --delete-stale.',
      ].join('\n'));
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex').toUpperCase();
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function readPreparedInput() {
  for (const filePath of [EXPORT_MANIFEST_PATH, INPUT_PATH, ...Object.values(EXPORT_FILES)]) {
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
      throw new Error(`Required migration input is missing or empty: ${path.basename(filePath)}.`);
    }
  }

  const manifest = JSON.parse(fs.readFileSync(EXPORT_MANIFEST_PATH, 'utf8'));
  if (manifest.sourceProjectRef !== 'fbvztmttixmmqorvqtbb' || manifest.connectionUriFound !== false) {
    throw new Error('The export manifest does not match the reviewed Supabase source snapshot.');
  }
  for (const [name, filePath] of Object.entries(EXPORT_FILES)) {
    const actualHash = sha256(fs.readFileSync(filePath));
    if (actualHash !== manifest.files?.[name]?.sha256) {
      throw new Error(`The ${name} export changed after validation; regenerate and review the migration input.`);
    }
  }

  const inputText = fs.readFileSync(INPUT_PATH, 'utf8');
  const inputHash = sha256(inputText);
  const documents = inputText.trimEnd().split(/\r?\n/).map((line, index) => {
    let document;
    try {
      document = JSON.parse(line);
    } catch {
      throw new Error(`Invalid JSON in the prepared import at line ${index + 1}.`);
    }
    if (
      !document ||
      !ALLOWED_COLLECTIONS.has(document.collection) ||
      typeof document.id !== 'string' ||
      document.id.length === 0 ||
      document.id.includes('/') ||
      document.id.includes('\0') ||
      !document.data ||
      typeof document.data !== 'object' ||
      Array.isArray(document.data)
    ) {
      throw new Error(`Invalid or out-of-scope Firestore document at import line ${index + 1}.`);
    }
    return document;
  });

  if (documents.length !== manifest.firestorePreparation?.documentCount) {
    throw new Error('Prepared document count does not match its export manifest.');
  }

  const seen = new Set();
  const counts = {};
  for (const document of documents) {
    const key = `${document.collection}/${document.id}`;
    if (seen.has(key)) throw new Error(`Duplicate prepared Firestore document: ${document.collection}.`);
    seen.add(key);
    counts[document.collection] = (counts[document.collection] ?? 0) + 1;
  }
  if (canonical(counts) !== canonical(manifest.firestorePreparation.countsByCollection)) {
    throw new Error('Prepared per-collection counts do not match the reviewed export manifest.');
  }

  return { documents, inputHash, manifest };
}

function getAccessToken() {
  const gcloudPath = path.join(
    process.env.LOCALAPPDATA ?? '',
    'Google',
    'Cloud SDK',
    'google-cloud-sdk',
    'bin',
    'gcloud.cmd',
  );
  if (!fs.existsSync(gcloudPath)) throw new Error('Google Cloud SDK was not found in its expected install location.');

  try {
    const token = execFileSync(
      'powershell.exe',
      ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', '& $env:FESTRONIX_GCLOUD auth application-default print-access-token'],
      {
        encoding: 'utf8',
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'ignore'],
        env: { ...process.env, FESTRONIX_GCLOUD: gcloudPath },
      },
    ).trim();
    if (!token) throw new Error('empty token');
    return token;
  } catch {
    throw new Error('Could not obtain a short-lived token from Google Application Default Credentials.');
  }
}

let accessToken;

async function api(url, init = {}, retryAuth = true) {
  const response = await fetch(url, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${accessToken}` },
  });
  if (response.status === 401 && retryAuth) {
    accessToken = getAccessToken();
    return api(url, init, false);
  }
  if (!response.ok) {
    let reason = response.statusText;
    try {
      const body = await response.json();
      reason = body.error?.status ?? body.error?.message ?? reason;
    } catch {
      // Keep the response body out of console output; it may contain request details.
    }
    throw new Error(`Firestore API request failed (${response.status}: ${reason}).`);
  }
  return response.json();
}

function userInfoUrl() {
  return 'https://www.googleapis.com/oauth2/v2/userinfo';
}

async function listCollection(collection) {
  const documents = [];
  let pageToken;
  do {
    const query = new URLSearchParams({ pageSize: String(PAGE_SIZE) });
    if (pageToken) query.set('pageToken', pageToken);
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${encodeURIComponent(collection)}?${query}`;
    const result = await api(url);
    documents.push(...(result.documents ?? []));
    pageToken = result.nextPageToken;
    if (documents.length > 5000) throw new Error(`Unexpectedly large destination collection: ${collection}.`);
  } while (pageToken);
  return documents;
}

function decodeValue(value) {
  if (Object.hasOwn(value, 'nullValue')) return null;
  if (Object.hasOwn(value, 'stringValue')) return value.stringValue;
  if (Object.hasOwn(value, 'booleanValue')) return value.booleanValue;
  if (Object.hasOwn(value, 'integerValue')) return Number(value.integerValue);
  if (Object.hasOwn(value, 'doubleValue')) return Number(value.doubleValue);
  if (Object.hasOwn(value, 'timestampValue')) {
    return { __firestoreType: 'timestamp', value: new Date(value.timestampValue).toISOString() };
  }
  if (Object.hasOwn(value, 'arrayValue')) return (value.arrayValue.values ?? []).map(decodeValue);
  if (Object.hasOwn(value, 'mapValue')) return decodeFields(value.mapValue.fields ?? {});
  throw new Error('Firestore returned an unsupported value type during parity verification.');
}

function decodeFields(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
}

function encodeValue(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Non-finite number found in prepared Firestore data.');
    return Number.isSafeInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  if (value && typeof value === 'object') {
    if (
      value.__firestoreType === 'timestamp' &&
      Object.keys(value).length === 2 &&
      typeof value.value === 'string' &&
      Number.isFinite(Date.parse(value.value))
    ) {
      return { timestampValue: new Date(value.value).toISOString() };
    }
    return { mapValue: { fields: encodeFields(value) } };
  }
  throw new Error('Unsupported value in prepared Firestore data.');
}

function encodeFields(fields) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, encodeValue(value)]));
}

function collectionCounts(documents) {
  const counts = {};
  for (const document of documents) counts[document.collection] = (counts[document.collection] ?? 0) + 1;
  return counts;
}

function staleRelationshipSummary(staleDocuments) {
  const staleEvents = new Set(staleDocuments.filter(document => document.collection === 'events').map(document => document.id));
  const staleRegistrations = staleDocuments.filter(document => document.collection === 'registrations');
  const staleRegistrationIds = new Set(staleRegistrations.map(document => document.id));
  const linksToStaleEvent = document => staleEvents.has(document.data.event_id);
  const linksToStaleRegistration = document => staleRegistrationIds.has(document.data.registration_id);
  const paymentOrders = staleDocuments.filter(document => document.collection === 'paymentOrders');
  const paymentOrderStatuses = new Map();
  for (const document of paymentOrders) {
    const status = typeof document.data.status === 'string' ? document.data.status : 'unknown';
    paymentOrderStatuses.set(status, (paymentOrderStatuses.get(status) ?? 0) + 1);
  }
  return {
    staleEvents: staleEvents.size,
    staleRegistrationsLinkedToStaleEvent: staleRegistrations.filter(linksToStaleEvent).length,
    staleTicketsLinkedToStaleRegistration: staleDocuments.filter(document => document.collection === 'tickets' && linksToStaleRegistration(document)).length,
    stalePaymentOrdersLinkedToStaleEvent: paymentOrders.filter(linksToStaleEvent).length,
    staleEmailDeliveriesLinkedToStaleRegistration: staleDocuments.filter(document => document.collection === 'emailDeliveries' && linksToStaleRegistration(document)).length,
    stalePaymentOrderStatuses: Object.fromEntries(paymentOrderStatuses),
  };
}

async function inspectDestination(documents) {
  const expectedByCollection = new Map();
  for (const document of documents) {
    if (!expectedByCollection.has(document.collection)) expectedByCollection.set(document.collection, new Map());
    expectedByCollection.get(document.collection).set(document.id, document);
  }

  const existingByCollection = new Map();
  const changed = [];
  const unexpected = [];
  for (const collection of ALLOWED_COLLECTIONS) {
    const existing = await listCollection(collection);
    const expected = expectedByCollection.get(collection) ?? new Map();
    for (const firestoreDocument of existing) {
      const id = firestoreDocument.name.split('/').at(-1);
      const prepared = expected.get(id);
      if (!prepared) {
        unexpected.push({ collection, id, data: decodeFields(firestoreDocument.fields ?? {}) });
        continue;
      }
      const actualData = decodeFields(firestoreDocument.fields ?? {});
      if (canonical(actualData) !== canonical(prepared.data)) {
        changed.push(prepared);
      }
    }
    existingByCollection.set(collection, new Set(existing.map((document) => document.name.split('/').at(-1))));
  }

  const missing = documents.filter((document) => !existingByCollection.get(document.collection)?.has(document.id));
  return { missing, changed, unexpected, existingByCollection };
}

function firestoreDocumentName(collection, id) {
  return `projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${id}`;
}

async function writeBatch(batch) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:batchWrite`;
  const result = await api(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      writes: batch.map((operation) => operation.delete
        ? { delete: firestoreDocumentName(operation.collection, operation.id) }
        : {
          update: {
            name: firestoreDocumentName(operation.collection, operation.id),
            fields: encodeFields(operation.data),
          },
        }),
    }),
  });
  const statuses = result.status ?? [];
  if (statuses.length !== batch.length) throw new Error('Firestore returned an incomplete write status list.');
  const failureIndex = statuses.findIndex((status) => status.code !== undefined && status.code !== 0);
  if (failureIndex !== -1) {
    const status = statuses[failureIndex];
    throw new Error(`A staging write failed for ${batch[failureIndex].collection}/${batch[failureIndex].id} (${status.code}: ${status.message ?? 'unknown error'}).`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const { documents, inputHash, manifest } = readPreparedInput();
  console.log(`Prepared source: ${manifest.validation?.totalRows ?? 'unknown'} database rows; ${documents.length} Firestore documents.`);
  console.log(`Prepared input SHA-256: ${inputHash}`);
  console.log(`Target: ${PROJECT_ID} / (default) / ${EXPECTED_LOCATION}`);

  accessToken = getAccessToken();
  const identity = await api(userInfoUrl());
  const account = identity.email ?? '';
  console.log(`Authorized Google account: ${account || '(email unavailable)'}`);
  if (options.apply && (!options['expected-account'] || options['expected-account'].toLowerCase() !== account.toLowerCase())) {
    throw new Error('Apply requires --expected-account to match the authenticated Google account.');
  }

  const databaseUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)`;
  const database = await api(databaseUrl);
  if (database.locationId !== EXPECTED_LOCATION || database.type !== 'FIRESTORE_NATIVE') {
    throw new Error('The target Firestore database does not match the reviewed staging project and Mumbai location.');
  }

  const initialPlan = await inspectDestination(documents);
  console.log(`Destination preflight: ${documents.length - initialPlan.missing.length - initialPlan.changed.length} matching; ${initialPlan.missing.length} missing; ${initialPlan.changed.length} changed; ${initialPlan.unexpected.length} stale allowlisted documents.`);
  if (initialPlan.changed.length) console.log(`Changed by collection: ${JSON.stringify(collectionCounts(initialPlan.changed))}`);
  if (initialPlan.missing.length) console.log(`Missing by collection: ${JSON.stringify(collectionCounts(initialPlan.missing))}`);
  if (initialPlan.unexpected.length) console.log(`Stale by collection: ${JSON.stringify(collectionCounts(initialPlan.unexpected))}`);
  if (initialPlan.unexpected.length) console.log(`Stale relationship check: ${JSON.stringify(staleRelationshipSummary(initialPlan.unexpected))}`);
  if (!options.apply) {
    console.log('Read-only preflight complete. No Firebase data was written.');
    console.log('Applying missing documents requires project/hash/account confirmation. Changed documents also require --refresh; stale documents require --delete-stale.');
    return;
  }

  if (
    options.project !== PROJECT_ID ||
    options['confirm-project'] !== PROJECT_ID ||
    options.sha256?.toUpperCase() !== inputHash
  ) {
    throw new Error('Apply blocked: target confirmation or prepared-input SHA-256 did not match the reviewed staging snapshot.');
  }
  if ((initialPlan.changed.length || initialPlan.unexpected.length) && !options.refresh) {
    throw new Error('Apply blocked: changed or stale staging data requires the explicit --refresh option.');
  }
  if (initialPlan.unexpected.length && !options.deleteStale) {
    throw new Error('Apply blocked: stale allowlisted staging documents require the explicit --delete-stale option.');
  }

  const operations = [...initialPlan.missing, ...initialPlan.changed];
  if (options.deleteStale) operations.push(...initialPlan.unexpected.map(({ collection, id }) => ({ collection, id, delete: true })));
  for (let offset = 0; offset < operations.length; offset += BATCH_SIZE) {
    const batch = operations.slice(offset, offset + BATCH_SIZE);
    await writeBatch(batch);
    console.log(`Applied ${Math.min(offset + batch.length, operations.length)} of ${operations.length} staging reconciliation operations.`);
  }

  const finalPlan = await inspectDestination(documents);
  if (finalPlan.missing.length || finalPlan.changed.length || (options.deleteStale && finalPlan.unexpected.length)) {
    throw new Error('Staging parity verification found remaining migration differences.');
  }
  console.log(`Staging import and parity verification succeeded for ${documents.length} source documents.`);
  console.log(`Stale allowlisted documents remaining: ${finalPlan.unexpected.length}.`);
}

main().catch((error) => {
  console.error(`Staging import stopped: ${error.message}`);
  process.exitCode = 1;
});
