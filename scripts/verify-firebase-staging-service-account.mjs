import fs from 'node:fs';
import path from 'node:path';
import { createFirebaseFirestoreClient } from './lib/firebaseFirestore.mjs';

const PROJECT_ID = 'festronix-migration-stg26';
const keyPath = process.argv[2];
if (!keyPath) throw new Error('Pass the local service-account JSON path as the only argument.');

const keyFile = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
if (
  keyFile.type !== 'service_account' ||
  keyFile.project_id !== PROJECT_ID ||
  typeof keyFile.client_email !== 'string' ||
  typeof keyFile.private_key !== 'string'
) {
  throw new Error('The local JSON file is not a valid service account for the staging project.');
}

const migrationDirectory = path.join(
  process.env.LOCALAPPDATA ?? '',
  'FestronixMigration',
  'supabase-export',
);
const preparedPath = path.join(migrationDirectory, 'firestore-import.ndjson');
if (!fs.existsSync(preparedPath)) {
  throw new Error('The local prepared migration snapshot is missing.');
}

let publicEventId;
for (const line of fs.readFileSync(preparedPath, 'utf8').split(/\r?\n/u)) {
  if (!line) continue;
  const document = JSON.parse(line);
  if (document.collection === 'publicEvents') {
    publicEventId = document.id;
    break;
  }
}
if (!publicEventId) throw new Error('The prepared snapshot has no public event projection.');

const client = createFirebaseFirestoreClient({
  projectId: PROJECT_ID,
  serviceAccountEmail: keyFile.client_email,
  privateKey: keyFile.private_key,
});
const document = await client.getDocument('publicEvents', publicEventId);
if (!document?.fields) throw new Error('The service account could not read the staging public event projection.');

const fields = document.fields;
const allowedFields = new Set([
  'isPublished', 'id', 'slug', 'title', 'tagline', 'departmentId', 'departmentCode',
  'category', 'format', 'minTeamSize', 'maxTeamSize', 'fee', 'capacity', 'registeredCount',
  'deadline', 'date', 'time', 'venue', 'description', 'rules', 'prizes', 'eligibility',
  'coordinatorName', 'coordinatorPhone', 'coordinatorEmail', 'status', 'faqs', 'approvalStatus',
]);
if (
  fields.isPublished?.booleanValue !== true ||
  fields.approvalStatus?.stringValue !== 'approved' ||
  fields.status?.stringValue !== 'open' ||
  Object.keys(fields).some(name => !allowedFields.has(name))
) {
  throw new Error('The staging public projection failed its field-allowlist check.');
}

console.log('Service-account OAuth and read-only staging access passed.');
console.log('The returned event document matched the public field allowlist.');
console.log('No Firestore data was written, and no key or event details were printed.');
