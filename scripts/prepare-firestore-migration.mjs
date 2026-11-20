import fs from 'node:fs';
import path from 'node:path';
import { buildRegistrationRollClaims } from './lib/registrationRollClaims.mjs';

const exportDirectory = path.join(
  process.env.LOCALAPPDATA ?? '',
  'FestronixMigration',
  'supabase-export',
);
const schemaPath = path.join(exportDirectory, 'public-schema.sql');
const dataPath = path.join(exportDirectory, 'public-data.sql');
const outputPath = path.join(exportDirectory, 'firestore-import.ndjson');
const manifestPath = path.join(exportDirectory, 'manifest.json');
const registrationRollClaimSecretPath = path.join(exportDirectory, 'registration-roll-claim.key');

const collectionByTable = {
  profiles: 'profiles',
  departments: 'departments',
  admin_roles: 'adminRoles',
  admin_event_assignments: 'adminEventAssignments',
  events: 'events',
  registrations: 'registrations',
  registration_members: 'registrationMembers',
  tickets: 'tickets',
  payment_proofs: 'paymentProofs',
  announcements: 'announcements',
  audit_logs: 'auditLogs',
  certificates: 'certificates',
  sponsors: 'sponsors',
  sponsor_profiles: 'sponsorProfiles',
  teams: 'teams',
  razorpay_orders: 'paymentOrders',
  registration_email_deliveries: 'emailDeliveries',
};

for (const filePath of [schemaPath, dataPath]) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
    throw new Error(`Missing or empty export file: ${path.basename(filePath)}`);
  }
}

function decodeCopyField(value) {
  if (value === '\\N') return null;
  let decoded = '';
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character !== '\\' || index + 1 >= value.length) {
      decoded += character;
      continue;
    }
    const escaped = value[++index];
    const simpleEscapes = { b: '\b', f: '\f', n: '\n', r: '\r', t: '\t', v: '\v', '\\': '\\' };
    if (Object.hasOwn(simpleEscapes, escaped)) {
      decoded += simpleEscapes[escaped];
    } else if (escaped === 'x' && /^[0-9a-f]{2}/i.test(value.slice(index + 1, index + 3))) {
      decoded += String.fromCharCode(Number.parseInt(value.slice(index + 1, index + 3), 16));
      index += 2;
    } else if (/[0-7]/.test(escaped)) {
      const octal = (escaped + value.slice(index + 1, index + 3)).match(/^[0-7]{1,3}/)?.[0] ?? escaped;
      decoded += String.fromCharCode(Number.parseInt(octal, 8));
      index += octal.length - 1;
    } else {
      decoded += escaped;
    }
  }
  return decoded;
}

function getColumnTypeMaps(schemaText) {
  const typesByTable = new Map();
  const tablePattern = /^CREATE TABLE(?: IF NOT EXISTS)?\s+"public"\."([^"]+)"\s*\((.*?)^\);/gims;
  const columnPattern = /^\s+"([^"]+)"\s+(?:"([^"]+)"|(timestamp with time zone|timestamp without time zone|double precision|character varying(?:\(\d+\))?|[a-zA-Z][a-zA-Z0-9_]*(?:\[\])?))(?=\s|,|$)/;

  for (const tableMatch of schemaText.matchAll(tablePattern)) {
    const tableName = tableMatch[1];
    const columnTypes = new Map();
    for (const line of tableMatch[2].split(/\r?\n/)) {
      const columnMatch = line.match(columnPattern);
      if (columnMatch) columnTypes.set(columnMatch[1], (columnMatch[2] ?? columnMatch[3]).toLowerCase());
    }
    if (columnTypes.size === 0) throw new Error(`No columns parsed for ${tableName}.`);
    typesByTable.set(tableName, columnTypes);
  }
  return typesByTable;
}

function parseCopyData(dataText, typesByTable) {
  const parsedTables = new Map();
  let currentTable;
  let columns;
  let rows;
  let columnMismatches = 0;
  let copyBlocks = 0;

  for (const line of dataText.split(/\r?\n/)) {
    if (!currentTable) {
      const header = line.match(/^COPY\s+"public"\."([^"]+)"\s*\((.*)\) FROM stdin;$/);
      if (!header) continue;
      currentTable = header[1];
      columns = [...header[2].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
      rows = [];
      copyBlocks += 1;
      if (!typesByTable.has(currentTable)) throw new Error(`No schema type map for ${currentTable}.`);
      continue;
    }

    if (line === '\\.') {
      parsedTables.set(currentTable, { columns, rows });
      currentTable = undefined;
      columns = undefined;
      rows = undefined;
      continue;
    }

    const values = line.split('\t').map(decodeCopyField);
    if (values.length !== columns.length) columnMismatches += 1;
    const record = {};
    const columnTypes = typesByTable.get(currentTable);
    for (let index = 0; index < columns.length; index += 1) {
      const column = columns[index];
      const type = columnTypes.get(column);
      if (!type) throw new Error(`Missing type for ${currentTable}.${column}.`);
      record[column] = convertValue(values[index] ?? null, type, currentTable, column);
    }
    rows.push(record);
  }

  if (currentTable) throw new Error(`COPY block did not terminate: ${currentTable}`);
  return { parsedTables, columnMismatches, copyBlocks };
}

function convertValue(value, type, table, column) {
  if (value === null) return null;
  if (type === 'json' || type === 'jsonb') {
    try {
      return JSON.parse(value);
    } catch {
      throw new Error(`Invalid JSON in ${table}.${column}.`);
    }
  }
  if (type === 'boolean') {
    if (value === 't' || value === 'true') return true;
    if (value === 'f' || value === 'false') return false;
    throw new Error(`Invalid boolean in ${table}.${column}.`);
  }
  if (/^(smallint|integer|bigint|numeric|real|double precision)$/.test(type)) {
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error(`Invalid number in ${table}.${column}.`);
    if (/^(smallint|integer|bigint)$/.test(type) && !Number.isSafeInteger(number)) {
      throw new Error(`Integer is outside JavaScript's safe range in ${table}.${column}.`);
    }
    return number;
  }
  if (type === 'timestamp with time zone' || type === 'timestamp without time zone' || type === 'date') {
    const time = Date.parse(value);
    if (!Number.isFinite(time)) throw new Error(`Invalid timestamp in ${table}.${column}.`);
    return { __firestoreType: 'timestamp', value: new Date(time).toISOString() };
  }
  if (type.endsWith('[]')) {
    throw new Error(`PostgreSQL array conversion is not implemented for ${table}.${column}.`);
  }
  return value;
}

function requireDocumentId(table, row) {
  if (table === 'departments') return row.code;
  if (table === 'admin_event_assignments') return `${row.admin_user_id}__${row.event_id}`;
  if (table === 'teams') return row.id;
  return row.id;
}

const schemaText = fs.readFileSync(schemaPath, 'utf8');
const dataText = fs.readFileSync(dataPath, 'utf8');
const typesByTable = getColumnTypeMaps(schemaText);
const { parsedTables, columnMismatches, copyBlocks } = parseCopyData(dataText, typesByTable);
const missingTables = Object.keys(collectionByTable).filter((table) => !parsedTables.has(table));
if (missingTables.length) throw new Error(`Missing table data blocks: ${missingTables.join(', ')}.`);
if (Object.keys(collectionByTable).length !== 17 || copyBlocks !== 17 || columnMismatches !== 0) {
  throw new Error(`Unexpected source shape: tables=${Object.keys(collectionByTable).length}, blocks=${copyBlocks}, column mismatches=${columnMismatches}.`);
}

const events = parsedTables.get('events').rows;
const eventIds = new Set(events.map((event) => event.id));
const eventSlugs = new Set(events.map((event) => event.slug));
const teamRows = parsedTables.get('teams').rows;
const activeTeams = teamRows.filter((team) => eventIds.has(team.event_id) || eventSlugs.has(team.event_id));
const orphanTeams = teamRows.filter((team) => !eventIds.has(team.event_id) && !eventSlugs.has(team.event_id));

const docs = [];
const countsByCollection = {};
const documentIds = new Map();
let maxDocumentBytes = 0;
const oversizedDocuments = [];
function appendDocument(collection, id, data) {
  if (typeof id !== 'string' || id.length === 0 || id.includes('/') || id.includes('\0')) {
    throw new Error(`Invalid Firestore document ID found in ${collection}.`);
  }
  const key = `${collection}/${id}`;
  if (documentIds.has(key)) throw new Error(`Duplicate Firestore document key found in ${collection}.`);
  documentIds.set(key, true);
  const document = { collection, id, data };
  const bytes = Buffer.byteLength(JSON.stringify(document), 'utf8');
  maxDocumentBytes = Math.max(maxDocumentBytes, bytes);
  if (bytes > 900_000) oversizedDocuments.push({ collection, bytes });
  docs.push(document);
  countsByCollection[collection] = (countsByCollection[collection] ?? 0) + 1;
}

function publicDeadline(value) {
  if (value === null) return '';
  if (typeof value === 'string') return value;
  if (
    value &&
    typeof value === 'object' &&
    value.__firestoreType === 'timestamp' &&
    typeof value.value === 'string' &&
    Number.isFinite(Date.parse(value.value))
  ) {
    return new Date(value.value).toISOString();
  }
  throw new Error('An event registration deadline has an unsupported value type.');
}

function appendDocuments(table, rows, collection) {
  for (const row of rows) {
    const id = requireDocumentId(table, row);
    const data = { ...row };
    if (table === 'registrations') {
      data.lookup_email = String(row.leader_email ?? '').trim().toLowerCase();
      data.lookup_roll = String(row.leader_roll ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      data.lookup_team_code = String(row.team_code ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    } else if (table === 'registration_members') {
      data.lookup_email = String(row.email ?? '').trim().toLowerCase();
      data.lookup_roll = String(row.roll_number ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    } else if (table === 'teams') {
      data.lookup_team_code = String(row.team_code ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    }
    if (table === 'teams' && collection === 'legacyOrphanTeams') {
      data._migration = { reason: 'referenced_event_missing_from_source_snapshot' };
    }
    appendDocument(collection, id, data);
  }
}

for (const [table, collection] of Object.entries(collectionByTable)) {
  if (table === 'teams') {
    appendDocuments('teams', activeTeams, collection);
    appendDocuments('teams', orphanTeams, 'legacyOrphanTeams');
  } else {
    appendDocuments(table, parsedTables.get(table).rows, collection);
  }
}

// Backfill the normalized uniqueness index needed by Firebase registration
// transactions. Team roster rows can mirror their member registration rows;
// the helper coalesces those only when their event/team identity matches.
const registrationRollClaims = buildRegistrationRollClaims(
  parsedTables.get('registrations').rows,
  parsedTables.get('registration_members').rows,
  fs.existsSync(registrationRollClaimSecretPath)
    ? fs.readFileSync(registrationRollClaimSecretPath, 'utf8').trim()
    : '',
);
for (const claim of registrationRollClaims) {
  appendDocument('registrationRollClaims', claim.id, claim.data);
}
const registrationRollClaimConflictCount = registrationRollClaims
  .filter(claim => claim.data.conflict).length;

const publicOpenEvents = parsedTables.get('events').rows.filter((event) =>
  event.status === 'open' &&
  event.approval_status === 'approved' &&
  event.is_deleted === false &&
  event.deleted_at === null
);
for (const event of publicOpenEvents) {
  const prizes = event.prizes && typeof event.prizes === 'object' ? event.prizes : {};
  const publicPrizes = {};
  for (const key of ['first', 'second', 'third', 'special']) {
    if (typeof prizes[key] === 'string' && prizes[key].trim()) publicPrizes[key] = prizes[key].trim();
  }
  if (!publicPrizes.first) publicPrizes.first = 'Trophy';

  const faqs = Array.isArray(event.faqs)
    ? event.faqs.filter((faq) => faq && typeof faq.question === 'string' && typeof faq.answer === 'string')
      .map(({ question, answer }) => ({ question, answer }))
    : [];

  // This is a deliberate public allowlist. Internal approval/deletion fields,
  // cluster scope, payment instructions, WhatsApp invite links, and all
  // registration/participant data stay out of the public collection.
  appendDocument('publicEvents', event.id, {
    isPublished: true,
    id: event.id,
    slug: event.slug,
    title: event.title,
    tagline: event.tagline,
    departmentId: event.department_id || '',
    departmentCode: event.department_code,
    category: event.category,
    format: event.format,
    minTeamSize: event.min_team_size,
    maxTeamSize: event.max_team_size,
    fee: event.fee,
    capacity: event.capacity,
    registeredCount: event.registered_count,
    // Keep this public API field as ISO text even though Postgres TIMESTAMPTZ
    // values in the private migration snapshot are represented as Timestamps.
    deadline: publicDeadline(event.deadline),
    date: event.date_display,
    time: event.time_display,
    venue: event.venue,
    description: event.description,
    rules: Array.isArray(event.rules) ? event.rules.filter((rule) => typeof rule === 'string') : [],
    prizes: publicPrizes,
    eligibility: event.eligibility,
    coordinatorName: event.coordinator_name,
    coordinatorPhone: event.coordinator_phone,
    coordinatorEmail: event.coordinator_email,
    status: 'open',
    faqs,
    approvalStatus: 'approved',
  });
}

if (oversizedDocuments.length) {
  throw new Error(`Firestore documents exceed the conservative size limit: ${oversizedDocuments.length}.`);
}

const ndjson = `${docs.map((document) => JSON.stringify(document)).join('\n')}\n`;
fs.writeFileSync(outputPath, ndjson, { encoding: 'utf8', mode: 0o600 });
const oldManifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
const conversionReport = {
  outputFile: path.basename(outputPath),
  documentCount: docs.length,
  countsByCollection,
  sourceTeamRows: teamRows.length,
  activeTeamRows: activeTeams.length,
  archivedOrphanTeamRows: orphanTeams.length,
  registrationRollClaimCount: registrationRollClaims.length,
  registrationRollClaimAlgorithm: 'HMAC-SHA-256',
  registrationRollClaimConflictCount,
  registrationRollClaimConflictEventIds: [...new Set(registrationRollClaims
    .filter(claim => claim.data.conflict)
    .map(claim => claim.data.event_id))].sort(),
  publicOpenEventProjectionCount: publicOpenEvents.length,
  publicDeadlineEncoding: 'ISO-8601 string; null becomes empty string',
  publicEventProjectionExcludedFields: [
    'cluster_code',
    'payment_instructions',
    'whatsapp_group_link',
    'approval/deletion audit fields',
    'registration and participant collections',
  ],
  maxDocumentJsonBytes: maxDocumentBytes,
  oversizedDocuments: oversizedDocuments.length,
  writeMode: 'dry-run-only; no Firebase writes performed',
};
fs.writeFileSync(manifestPath, `${JSON.stringify({ ...oldManifest, firestorePreparation: conversionReport, preparedAtUtc: new Date().toISOString() }, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });

console.log(JSON.stringify(conversionReport, null, 2));
