import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { deleteApp, initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
import { createFirebaseFirestoreClient } from './lib/firebaseFirestore.mjs';

const PROJECT_ID = 'festronix-migration-stg26';
const SOURCE_PROJECT_REF = 'fbvztmttixmmqorvqtbb';
const SYNC_MANIFEST_PATH = path.join(
  process.env.LOCALAPPDATA ?? '',
  'FestronixMigration',
  'supabase-export',
  'firebase-public-events-sync.json',
);
const PUBLIC_FIELDS = new Set([
  'isPublished', 'id', 'slug', 'title', 'tagline', 'departmentId', 'departmentCode',
  'category', 'format', 'minTeamSize', 'maxTeamSize', 'fee', 'capacity', 'registeredCount',
  'deadline', 'date', 'time', 'venue', 'description', 'rules', 'prizes', 'eligibility',
  'coordinatorName', 'coordinatorPhone', 'coordinatorEmail', 'status', 'faqs', 'approvalStatus',
]);
const PRIVATE_FIELDS = new Set([
  'clusterCode', 'paymentInstructions', 'whatsappGroupLink', 'deletedBy', 'deletedAt',
  'is_deleted', 'payment_instructions', 'whatsapp_group_link',
]);
const SOURCE_COLUMNS = [
  'id', 'slug', 'title', 'tagline', 'department_id', 'department_code', 'category', 'format',
  'min_team_size', 'max_team_size', 'fee', 'capacity', 'registered_count', 'deadline',
  'date_display', 'time_display', 'venue', 'description', 'rules', 'prizes', 'eligibility',
  'coordinator_name', 'coordinator_phone', 'coordinator_email', 'status', 'faqs',
  'approval_status', 'is_deleted', 'deleted_at',
].join(',');

function parseOptions(args) {
  const options = { apply: false };
  for (const arg of args) {
    if (arg === '--apply') options.apply = true;
    else {
      const match = arg.match(/^--(project|confirm-project|service-account)=(.*)$/u);
      if (!match) throw new Error('Unknown argument. See the script usage in its header.');
      options[match[1]] = match[2];
    }
  }
  return options;
}

function readEnvFiles() {
  const values = {};
  for (const filePath of ['.env', '.env.local']) {
    if (!fs.existsSync(filePath)) continue;
    for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/u)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/u);
      if (match) values[match[1]] = match[2].replace(/^['"]|['"]$/gu, '');
    }
  }
  return values;
}

function requiredText(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('A source event is missing required public text.');
  return value;
}

function requiredNumber(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('A source event has invalid public numeric data.');
  return value;
}

function deadlineText(value) {
  if (value === null) return '';
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) throw new Error('A source event has an invalid registration deadline.');
  return new Date(value).toISOString();
}

function publicDocument(row) {
  if (
    typeof row.id !== 'string' || !row.id || row.id.includes('/') || row.id.includes('\0') ||
    row.status !== 'open' || row.approval_status !== 'approved' ||
    row.is_deleted !== false || row.deleted_at !== null ||
    !['technical', 'workshop', 'hackathon', 'non-technical', 'gaming', 'departmental'].includes(row.category) ||
    !['individual', 'duo', 'team'].includes(row.format)
  ) throw new Error('A source row failed the approved/open event filter or public schema check.');

  const prizes = row.prizes && typeof row.prizes === 'object' && !Array.isArray(row.prizes) ? row.prizes : {};
  const faqs = Array.isArray(row.faqs) ? row.faqs.map(faq => {
    if (!faq || typeof faq.question !== 'string' || typeof faq.answer !== 'string') throw new Error('A source event has invalid FAQ data.');
    return { question: faq.question, answer: faq.answer };
  }) : [];
  const rules = Array.isArray(row.rules) ? row.rules.map(requiredText) : [];
  const data = {
    isPublished: true,
    id: row.id,
    slug: requiredText(row.slug),
    title: requiredText(row.title),
    departmentId: typeof row.department_id === 'string' ? row.department_id : '',
    departmentCode: requiredText(row.department_code),
    category: row.category,
    format: row.format,
    minTeamSize: requiredNumber(row.min_team_size),
    maxTeamSize: requiredNumber(row.max_team_size),
    fee: requiredNumber(row.fee),
    capacity: requiredNumber(row.capacity),
    registeredCount: requiredNumber(row.registered_count),
    deadline: deadlineText(row.deadline),
    date: requiredText(row.date_display),
    time: requiredText(row.time_display),
    venue: requiredText(row.venue),
    description: requiredText(row.description),
    rules,
    prizes: {
      first: typeof prizes.first === 'string' && prizes.first.trim() ? prizes.first.trim() : 'Trophy',
      ...(typeof prizes.second === 'string' && prizes.second.trim() ? { second: prizes.second.trim() } : {}),
      ...(typeof prizes.third === 'string' && prizes.third.trim() ? { third: prizes.third.trim() } : {}),
      ...(typeof prizes.special === 'string' && prizes.special.trim() ? { special: prizes.special.trim() } : {}),
    },
    coordinatorName: requiredText(row.coordinator_name),
    coordinatorPhone: requiredText(row.coordinator_phone),
    coordinatorEmail: requiredText(row.coordinator_email),
    status: 'open',
    faqs,
    approvalStatus: 'approved',
  };
  if (typeof row.tagline === 'string' && row.tagline) data.tagline = row.tagline;
  if (typeof row.eligibility === 'string' && row.eligibility) data.eligibility = row.eligibility;
  const unexpected = Object.keys(data).filter(field => !PUBLIC_FIELDS.has(field));
  if (unexpected.length || Object.keys(data).some(field => PRIVATE_FIELDS.has(field))) throw new Error('A source event exceeded the public field allowlist.');
  if (Buffer.byteLength(JSON.stringify(data), 'utf8') > 900_000) throw new Error('A public event exceeds the safe Firestore document size.');
  return data;
}

function canonical(value) {
  if (value && typeof value.toDate === 'function') return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  }
  return value;
}

function encodeValue(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  if (value && typeof value === 'object') {
    return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, encodeValue(nested)])) } };
  }
  throw new Error('A public event contains a value unsupported by Firestore.');
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const confirmedProject = options['confirm-project'];
  if (options.apply && (options.project !== PROJECT_ID || confirmedProject !== PROJECT_ID)) {
    throw new Error('Apply requires --project and --confirm-project to both match the pinned staging project.');
  }
  const env = readEnvFiles();
  if (
    env.VITE_FIREBASE_PROJECT_ID !== PROJECT_ID || !env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY ||
    !env.VITE_FIREBASE_API_KEY || !env.VITE_FIREBASE_AUTH_DOMAIN || !env.VITE_FIREBASE_APP_ID
  ) throw new Error('Local public client configuration is incomplete or does not target the expected projects.');
  if (new URL(env.VITE_SUPABASE_URL).hostname !== `${SOURCE_PROJECT_REF}.supabase.co`) {
    throw new Error('Supabase source configuration does not match the reviewed migration project.');
  }

  const db = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data: sourceRows, error } = await db.from('events').select(SOURCE_COLUMNS)
    .eq('status', 'open').eq('approval_status', 'approved').eq('is_deleted', false).is('deleted_at', null);
  if (error || !Array.isArray(sourceRows)) throw new Error('Read-only Supabase public event query failed.');
  const sourceById = new Map();
  for (const row of sourceRows) {
    const data = publicDocument(row);
    if (sourceById.has(data.id)) throw new Error('Supabase returned duplicate event identifiers.');
    sourceById.set(data.id, data);
  }
  if (sourceById.size === 0) throw new Error('Refusing to sync an empty public event result.');

  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  }, 'staging-public-events-sync');
  try {
    const currentSnapshot = await getDocs(query(collection(getFirestore(app), 'publicEvents'), where('isPublished', '==', true)));
    const targetById = new Map(currentSnapshot.docs.map(document => [document.id, document.data()]));
    for (const raw of targetById.values()) {
      const keys = Object.keys(raw);
      if (keys.some(key => !PUBLIC_FIELDS.has(key) || PRIVATE_FIELDS.has(key))) {
        throw new Error('A current staging projection contains fields outside the public allowlist.');
      }
    }

    const changed = [...sourceById].filter(([id, data]) => JSON.stringify(canonical(targetById.get(id) ?? null)) !== JSON.stringify(canonical(data)));
    const staleIds = [...targetById.keys()].filter(id => !sourceById.has(id));
    console.log(JSON.stringify({
      targetProject: PROJECT_ID,
      mode: options.apply ? 'apply' : 'dry-run',
      approvedOpenSourceEvents: sourceById.size,
      currentPublishedStagingEvents: targetById.size,
      documentsToCreateOrReplace: changed.length,
      stalePublicDocumentsToDelete: staleIds.length,
      privateFieldsIncluded: false,
    }));
    if (!options.apply) return;

    if (!options['service-account'] || !fs.existsSync(options['service-account'])) throw new Error('A local staging service-account JSON path is required for --apply.');
    const key = JSON.parse(fs.readFileSync(options['service-account'], 'utf8'));
    if (key.type !== 'service_account' || key.project_id !== PROJECT_ID || typeof key.client_email !== 'string' || typeof key.private_key !== 'string') {
      throw new Error('The supplied local credential is not a service account for the pinned staging project.');
    }
    const writer = createFirebaseFirestoreClient({ projectId: PROJECT_ID, serviceAccountEmail: key.client_email, privateKey: key.private_key });
    const refIds = [...new Set([...sourceById.keys(), ...targetById.keys()])];
    if (refIds.length > 100) throw new Error('The staging public projection exceeds the bounded atomic transaction size.');
    const references = refIds.map(id => ({ collection: 'publicEvents', id }));
    const changedIds = new Set(changed.map(([id]) => id));
    const staleSet = new Set(staleIds);
    await writer.runTransaction(references, ({ get }) => {
      const writes = [];
      for (const id of changedIds) {
        const existing = get('publicEvents', id);
        writes.push({
          update: {
            name: `projects/${PROJECT_ID}/databases/(default)/documents/publicEvents/${encodeURIComponent(id)}`,
            fields: Object.fromEntries(Object.entries(sourceById.get(id)).map(([field, value]) => [field, encodeValue(value)])),
          },
          currentDocument: existing ? { exists: true } : { exists: false },
        });
      }
      for (const id of staleSet) {
        if (!get('publicEvents', id)) throw new Error('Stale staging document changed during sync preflight.');
        writes.push({ delete: `projects/${PROJECT_ID}/databases/(default)/documents/publicEvents/${encodeURIComponent(id)}` });
      }
      return writes;
    });

    const verified = await getDocs(query(collection(getFirestore(app), 'publicEvents'), where('isPublished', '==', true)));
    const verifiedById = new Map(verified.docs.map(document => [document.id, document.data()]));
    if (verifiedById.size !== sourceById.size) throw new Error('Post-sync staging document count verification failed.');
    for (const [id, data] of sourceById) {
      const actual = verifiedById.get(id);
      if (!actual || JSON.stringify(canonical(actual)) !== JSON.stringify(canonical(data))) {
        throw new Error('Post-sync staging content verification failed.');
      }
      if (Object.keys(actual).some(field => !PUBLIC_FIELDS.has(field) || PRIVATE_FIELDS.has(field))) {
        throw new Error('Post-sync staging field allowlist verification failed.');
      }
    }
    fs.mkdirSync(path.dirname(SYNC_MANIFEST_PATH), { recursive: true });
    const sortedIds = [...sourceById.keys()].sort();
    fs.writeFileSync(SYNC_MANIFEST_PATH, `${JSON.stringify({
      version: 1,
      sourceProjectRef: SOURCE_PROJECT_REF,
      targetProjectId: PROJECT_ID,
      syncedAt: new Date().toISOString(),
      publicEventCount: sortedIds.length,
      sortedIdsSha256: createHash('sha256').update(sortedIds.join('\n')).digest('hex'),
    }, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    console.log('Atomic staging sync and read-back verification passed. No production database was changed.');
  } finally {
    await deleteApp(app);
  }
}

main().catch(error => {
  console.error(`Staging public event sync stopped: ${error.message}`);
  process.exitCode = 1;
});
