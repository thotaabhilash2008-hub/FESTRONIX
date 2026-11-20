import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { deleteApp, initializeApp } from 'firebase/app';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

const PROJECT_ID = 'festronix-migration-stg26';
const ROOT = process.cwd();
const ENV_PATH = path.join(ROOT, '.env.local');
const MANIFEST_PATH = path.join(
  process.env.LOCALAPPDATA ?? '',
  'FestronixMigration',
  'supabase-export',
  'manifest.json',
);
const SYNC_MANIFEST_PATH = path.join(
  process.env.LOCALAPPDATA ?? '',
  'FestronixMigration',
  'supabase-export',
  'firebase-public-events-sync.json',
);
const PUBLIC_EVENT_FIELDS = new Set([
  'isPublished', 'id', 'slug', 'title', 'tagline', 'departmentId', 'departmentCode',
  'category', 'format', 'minTeamSize', 'maxTeamSize', 'fee', 'capacity', 'registeredCount',
  'deadline', 'date', 'time', 'venue', 'description', 'rules', 'prizes', 'eligibility',
  'coordinatorName', 'coordinatorPhone', 'coordinatorEmail', 'status', 'faqs', 'approvalStatus',
]);
const PRIVATE_COLLECTIONS = [
  'profiles',
  'adminRoles',
  'registrations',
  'registrationMembers',
  'registrationRollClaims',
  'tickets',
  'paymentProofs',
  'paymentOrders',
  'teams',
  'emailDeliveries',
];

function readLocalEnv(filePath) {
  if (!fs.existsSync(filePath)) throw new Error('Missing ignored local .env.local configuration.');
  const entries = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
    .filter((line) => line && !line.trimStart().startsWith('#'))
    .map((line) => {
      const separator = line.indexOf('=');
      return separator < 0 ? null : [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
    })
    .filter(Boolean);
  return Object.fromEntries(entries);
}

async function expectDenied(database, collectionName) {
  try {
    await getDocs(query(collection(database, collectionName), limit(1)));
  } catch (error) {
    if (error?.code === 'permission-denied') return;
    throw new Error(`Firestore access check for a private collection did not return permission-denied (${collectionName}).`);
  }
  throw new Error(`Unauthenticated read unexpectedly succeeded for private collection ${collectionName}.`);
}

async function main() {
  const env = readLocalEnv(ENV_PATH);
  const config = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  };
  if (config.projectId !== PROJECT_ID || !config.apiKey || !config.appId || !config.authDomain) {
    throw new Error('Local Firebase config is incomplete or is not pinned to the staging project.');
  }
  if (!fs.existsSync(MANIFEST_PATH)) throw new Error('The reviewed local migration manifest is missing.');
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const syncManifest = fs.existsSync(SYNC_MANIFEST_PATH)
    ? JSON.parse(fs.readFileSync(SYNC_MANIFEST_PATH, 'utf8'))
    : null;
  if (syncManifest && (
    syncManifest.version !== 1 ||
    syncManifest.sourceProjectRef !== 'fbvztmttixmmqorvqtbb' ||
    syncManifest.targetProjectId !== PROJECT_ID ||
    !Number.isInteger(syncManifest.publicEventCount) ||
    typeof syncManifest.sortedIdsSha256 !== 'string'
  )) throw new Error('The local public event sync manifest is invalid or targets another project.');
  const expectedCount = syncManifest?.publicEventCount ?? manifest.firestorePreparation?.publicOpenEventProjectionCount;
  if (!Number.isInteger(expectedCount)) throw new Error('The manifest has no approved public event projection count.');

  const app = initializeApp(config, 'staging-public-read-check');
  try {
    const database = getFirestore(app);
    const snapshot = await getDocs(query(
      collection(database, 'publicEvents'),
      where('isPublished', '==', true),
    ));
    if (snapshot.size !== expectedCount) {
      throw new Error(`Public event count mismatch: expected ${expectedCount}, received ${snapshot.size}.`);
    }
    if (syncManifest) {
      const sortedIds = snapshot.docs.map(document => document.id).sort();
      const actualHash = createHash('sha256').update(sortedIds.join('\n')).digest('hex');
      if (actualHash !== syncManifest.sortedIdsSha256) throw new Error('The staging public event identifiers differ from the reviewed sync manifest.');
    }

    for (const document of snapshot.docs) {
      const data = document.data();
      if (
        data.isPublished !== true ||
        data.id !== document.id ||
        data.status !== 'open' ||
        data.approvalStatus !== 'approved'
      ) {
        throw new Error('The public event projection contains a non-published event.');
      }
      const unexpectedFields = Object.keys(data).filter((field) => !PUBLIC_EVENT_FIELDS.has(field));
      if (unexpectedFields.length) throw new Error('The public event projection contains fields outside the reviewed allowlist.');
      const deadlineIsText = typeof data.deadline === 'string';
      const deadlineIsTimestamp = Boolean(
        data.deadline &&
        typeof data.deadline === 'object' &&
        typeof data.deadline.toDate === 'function' &&
        Number.isFinite(data.deadline.toDate().getTime()),
      );
      if (!deadlineIsText && data.deadline !== null && data.deadline !== undefined && !deadlineIsTimestamp) {
        throw new Error('A public event registration deadline uses an unsupported value type.');
      }
      for (const forbidden of ['clusterCode', 'paymentInstructions', 'whatsappGroupLink', 'deletedBy', 'deletedAt']) {
        if (Object.hasOwn(data, forbidden)) throw new Error('The public event projection contains a restricted field.');
      }
    }

    for (const privateCollection of PRIVATE_COLLECTIONS) {
      await expectDenied(database, privateCollection);
    }

    console.log(`Public event read check passed for ${snapshot.size} approved/open event documents.`);
    console.log('Nullable deadlines are strings, nulls, or valid Firestore timestamps supported by the client adapter.');
    console.log(`Unauthenticated reads were denied for ${PRIVATE_COLLECTIONS.length} private collections.`);
    console.log('Only allowlisted public event fields were returned; no participant or team details were printed.');
  } finally {
    await deleteApp(app);
  }
}

main().catch((error) => {
  console.error(`Firebase staging read verification failed: ${error.message}`);
  process.exitCode = 1;
});
