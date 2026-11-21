/**
 * Sync event WhatsApp links from the reviewed Supabase project into Firestore.
 *
 * This is a dry-run by default. Pass --apply only after reviewing the reported diff.
 *
 * Required local configuration in .env.local (never committed):
 *   VITE_SUPABASE_URL=https://fbvztmttixmmqorvqtbb.supabase.co
 *   VITE_SUPABASE_ANON_KEY=<public read key>
 *   FIREBASE_PROJECT_ID=festronix-migration-stg26
 *   FIREBASE_SERVICE_ACCOUNT_JSON=<service account JSON>
 *
 * Usage:
 *   node scripts/sync-firebase-whatsapp-links-from-supabase.mjs
 *   node scripts/sync-firebase-whatsapp-links-from-supabase.mjs \
 *     --project festronix-migration-stg26 \
 *     --confirm-project festronix-migration-stg26 \
 *     --apply
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const PROJECT_ID = 'festronix-migration-stg26';
const EXPECTED_SUPABASE_HOST = 'fbvztmttixmmqorvqtbb.supabase.co';
const SOURCE_COLUMNS = [
  'id', 'slug', 'title', 'whatsapp_group_link', 'status', 'approval_status',
  'is_deleted', 'deleted_at',
].join(',');

function parseOptions(args) {
  const options = { apply: false };
  for (const arg of args) {
    if (arg === '--apply') {
      options.apply = true;
      continue;
    }
    const match = arg.match(/^--(project|confirm-project)=(.*)$/u);
    if (!match) throw new Error(`Unknown argument: ${arg}`);
    options[match[1]] = match[2];
  }
  return options;
}

function readEnvFiles() {
  const values = {};
  for (const filePath of ['.env', '.env.local']) {
    if (!fs.existsSync(filePath)) continue;
    for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/u)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/u);
      if (!match) continue;
      let value = match[2];
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      values[match[1]] = value;
    }
  }
  return values;
}

function canonicalLink(value) {
  if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) return null;
  if (typeof value !== 'string') throw new Error('A WhatsApp link is not a string.');
  const link = value.trim();
  if (Buffer.byteLength(link, 'utf8') > 1000) throw new Error('A WhatsApp link is longer than 1000 bytes.');
  let parsed;
  try {
    parsed = new URL(link);
  } catch {
    throw new Error(`WhatsApp link is invalid: ${link}`);
  }
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'chat.whatsapp.com') {
    throw new Error(`WhatsApp link must use https://chat.whatsapp.com: ${link}`);
  }
  return parsed.href;
}

function envValue(fileEnv, key) {
  return process.env[key] || fileEnv[key] || '';
}

async function readSupabaseEvents(url, key) {
  const endpoint = new URL(`${url}/rest/v1/events`);
  endpoint.searchParams.set('select', SOURCE_COLUMNS);
  endpoint.searchParams.set('status', 'eq.open');
  endpoint.searchParams.set('approval_status', 'eq.approved');
  endpoint.searchParams.set('is_deleted', 'eq.false');
  endpoint.searchParams.set('deleted_at', 'is.null');

  const response = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
    },
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Supabase read failed with HTTP ${response.status}: ${body.slice(0, 300)}`);
  const rows = JSON.parse(body);
  if (!Array.isArray(rows)) throw new Error('Supabase read did not return an array.');
  return rows;
}

async function readFirebaseEvents() {
  const snapshot = await getFirestore().collection('events').get();
  const byId = new Map();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    byId.set(doc.id, {
      id: doc.id,
      title: typeof data.title === 'string' ? data.title : null,
      slug: typeof data.slug === 'string' ? data.slug : null,
      link: data.whatsapp_group_link ?? data.whatsappGroupLink ?? null,
      isDeleted: data.is_deleted === true || data.isDeleted === true,
    });
  }
  return byId;
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const fileEnv = readEnvFiles();
  const supabaseUrl = envValue(fileEnv, 'VITE_SUPABASE_URL');
  const supabaseKey = envValue(fileEnv, 'VITE_SUPABASE_ANON_KEY');
  const projectId = envValue(fileEnv, 'FIREBASE_PROJECT_ID');
  const serviceAccountJson = envValue(fileEnv, 'FIREBASE_SERVICE_ACCOUNT_JSON');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env.local.');
  }
  if (new URL(supabaseUrl).hostname !== EXPECTED_SUPABASE_HOST) {
    throw new Error('VITE_SUPABASE_URL does not point to the reviewed Supabase project.');
  }
  if (projectId !== PROJECT_ID) {
    throw new Error(`FIREBASE_PROJECT_ID must be ${PROJECT_ID}.`);
  }
  if (!serviceAccountJson) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must be set in .env.local.');
  const serviceAccount = JSON.parse(serviceAccountJson);
  if (
    serviceAccount.type !== 'service_account' ||
    serviceAccount.project_id !== PROJECT_ID ||
    typeof serviceAccount.client_email !== 'string' ||
    typeof serviceAccount.private_key !== 'string'
  ) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not a service account for the pinned Firebase project.');

  if (options.apply && (options.project !== PROJECT_ID || options['confirm-project'] !== PROJECT_ID)) {
    throw new Error('--apply requires --project and --confirm-project to both match the pinned Firebase project.');
  }

  if (!getApps().length) initializeApp({ credential: cert(serviceAccount), projectId });
  const db = getFirestore();

  const sourceRows = await readSupabaseEvents(supabaseUrl, supabaseKey);
  const firebaseById = await readFirebaseEvents();
  const sourceById = new Map();
  const changes = [];
  const missingTargets = [];

  for (const row of sourceRows) {
    if (typeof row.id !== 'string' || !row.id || row.id.includes('/') || row.id.includes('\0')) {
      throw new Error('Supabase returned an invalid event identifier.');
    }
    if (sourceById.has(row.id)) throw new Error('Supabase returned duplicate event identifiers.');
    const sourceLink = canonicalLink(row.whatsapp_group_link);
    const source = {
      id: row.id,
      title: typeof row.title === 'string' ? row.title : null,
      slug: typeof row.slug === 'string' ? row.slug : null,
      link: sourceLink,
    };
    sourceById.set(row.id, source);

    const target = firebaseById.get(row.id);
    if (!target || target.isDeleted) {
      missingTargets.push({ id: row.id, title: source.title, slug: source.slug });
      continue;
    }
    const targetLink = canonicalLink(target.link);
    if (sourceLink !== targetLink) {
      changes.push({
        id: row.id,
        title: source.title,
        slug: source.slug,
        from: targetLink,
        to: sourceLink,
      });
    }
  }

  if (sourceById.size === 0) throw new Error('Refusing to sync an empty Supabase event result.');
  if (options.apply && missingTargets.length) {
    throw new Error('Refusing to apply because some active Supabase events have no matching active Firebase event.');
  }

  let auditLogged = false;
  if (options.apply && changes.length) {
    const now = new Date().toISOString();
    await db.runTransaction(async transaction => {
      for (const change of changes) {
        const ref = db.collection('events').doc(change.id);
        const fresh = await transaction.get(ref);
        if (!fresh.exists) throw new Error(`Firebase event ${change.id} disappeared during sync.`);
        const freshLink = canonicalLink(fresh.get('whatsapp_group_link') ?? fresh.get('whatsappGroupLink') ?? null);
        if (freshLink !== change.from) throw new Error(`Firebase event ${change.id} changed during sync; rerun the preview.`);
        transaction.update(ref, { whatsapp_group_link: change.to, updated_at: now });
      }
    });
    await db.collection('auditLogs').doc().set({
      action: 'whatsapp_links_synced_from_supabase',
      actor: 'sync-firebase-whatsapp-links-from-supabase.mjs',
      source_project: EXPECTED_SUPABASE_HOST,
      target_project: PROJECT_ID,
      changes: changes.length,
      created_at: now,
    });
    auditLogged = true;
  }

  console.log(JSON.stringify({
    mode: options.apply ? 'apply' : 'dry-run',
    sourceHost: EXPECTED_SUPABASE_HOST,
    targetProject: PROJECT_ID,
    sourceEventCount: sourceById.size,
    firebaseEventCount: firebaseById.size,
    changeCount: changes.length,
    missingTargetCount: missingTargets.length,
    changes,
    missingTargets,
    auditLogged,
  }, null, 2));
}

main().catch(error => {
  console.error(`WhatsApp link sync stopped: ${error.message}`);
  process.exitCode = 1;
});
