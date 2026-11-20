import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const exportDirectory = path.join(
  process.env.LOCALAPPDATA ?? '',
  'FestronixMigration',
  'supabase-export',
);
const schemaPath = path.join(exportDirectory, 'public-schema.sql');
const dataPath = path.join(exportDirectory, 'public-data.sql');
const manifestPath = path.join(exportDirectory, 'manifest.json');

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

function parsePublicTables(schemaText) {
  return [...schemaText.matchAll(/^CREATE TABLE(?: IF NOT EXISTS)?\s+"?public"?\."?([^"\s(]+)"?\s*\(/gim)]
    .map((match) => match[1])
    .filter((name, index, names) => names.indexOf(name) === index)
    .sort();
}

function parseCopyData(dataText) {
  const tables = new Map();
  let currentTable;
  let columns;
  let rows;
  let copyBlocks = 0;
  let columnMismatches = 0;

  for (const line of dataText.split(/\r?\n/)) {
    if (!currentTable) {
      const header = line.match(/^COPY\s+"?public"?\."?([^"\s(]+)"?\s*\((.*)\) FROM stdin;$/);
      if (!header) continue;
      currentTable = header[1];
      columns = [...header[2].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
      rows = [];
      copyBlocks += 1;
      continue;
    }

    if (line === '\\.') {
      tables.set(currentTable, { columns, rows });
      currentTable = undefined;
      columns = undefined;
      rows = undefined;
      continue;
    }

    const values = line.split('\t').map(decodeCopyField);
    if (values.length !== columns.length) columnMismatches += 1;
    const record = Object.fromEntries(columns.map((column, index) => [column, values[index] ?? null]));
    rows.push(record);
  }

  if (currentTable) throw new Error(`COPY block did not terminate: ${currentTable}`);
  return { tables, copyBlocks, columnMismatches };
}

function countMissingReference(rows, targetValues, field, allowNull = false) {
  return rows.filter((row) => {
    const value = row[field];
    if (allowNull && (value === null || value === '')) return false;
    return value === null || !targetValues.has(value);
  }).length;
}

function duplicateCount(rows, field, normalize = (value) => value) {
  const seen = new Set();
  let duplicates = 0;
  for (const row of rows) {
    const value = row[field];
    if (value === null || value === '') continue;
    const key = normalize(value);
    if (seen.has(key)) duplicates += 1;
    else seen.add(key);
  }
  return duplicates;
}

const schemaText = fs.readFileSync(schemaPath, 'utf8');
const dataText = fs.readFileSync(dataPath, 'utf8');
const schemaTables = parsePublicTables(schemaText);
const parsed = parseCopyData(dataText);
const tableRows = (name) => parsed.tables.get(name)?.rows ?? [];
const values = (name, field) => new Set(tableRows(name).map((row) => row[field]).filter((value) => value !== null && value !== ''));
const eventIds = values('events', 'id');
const eventSlugs = values('events', 'slug');
const registrationIds = values('registrations', 'id');
const departmentIds = values('departments', 'id');
const departmentCodes = values('departments', 'code');
const orderIds = values('razorpay_orders', 'razorpay_order_id');

const references = [
  ['events.department_id → departments.id', countMissingReference(tableRows('events'), departmentIds, 'department_id', true)],
  ['events.department_code → departments.code', countMissingReference(tableRows('events'), departmentCodes, 'department_code')],
  ['admin_roles.department_code → departments.code', countMissingReference(tableRows('admin_roles'), departmentCodes, 'department_code', true)],
  ['admin_roles.event_id → events.id', countMissingReference(tableRows('admin_roles'), eventIds, 'event_id', true)],
  ['admin_event_assignments.event_id → events.id', countMissingReference(tableRows('admin_event_assignments'), eventIds, 'event_id')],
  ['registrations.event_id → events.id', countMissingReference(tableRows('registrations'), eventIds, 'event_id')],
  ['registrations.razorpay_order_id → razorpay_orders.razorpay_order_id', countMissingReference(tableRows('registrations'), orderIds, 'razorpay_order_id', true)],
  ['registration_members.registration_id → registrations.id', countMissingReference(tableRows('registration_members'), registrationIds, 'registration_id')],
  ['tickets.registration_id → registrations.id', countMissingReference(tableRows('tickets'), registrationIds, 'registration_id')],
  ['payment_proofs.registration_id → registrations.id', countMissingReference(tableRows('payment_proofs'), registrationIds, 'registration_id')],
  ['announcements.department_code → departments.code', countMissingReference(tableRows('announcements'), departmentCodes, 'department_code', true)],
  ['announcements.event_id → events.id', countMissingReference(tableRows('announcements'), eventIds, 'event_id', true)],
  ['certificates.registration_id → registrations.id', countMissingReference(tableRows('certificates'), registrationIds, 'registration_id', true)],
  ['certificates.event_id → events.id', countMissingReference(tableRows('certificates'), eventIds, 'event_id', true)],
  ['razorpay_orders.event_id → events.id', countMissingReference(tableRows('razorpay_orders'), eventIds, 'event_id')],
  ['registration_email_deliveries.registration_id → registrations.id', countMissingReference(tableRows('registration_email_deliveries'), registrationIds, 'registration_id')],
];

const eventIdsOrSlugs = new Set([...eventIds, ...eventSlugs]);
const teams = tableRows('teams');
const unmatchedTeamRefs = teams
  .map((team) => team.event_id)
  .filter((eventRef) => eventRef !== null && eventRef !== '' && !eventIdsOrSlugs.has(eventRef));
const orphanTeamRows = teams.filter((team) => team.event_id !== null && team.event_id !== '' && !eventIdsOrSlugs.has(team.event_id));
const teamEventReferenceDiagnostics = {
  totalTeamRows: teams.length,
  matchedEventReferences: teams.length - unmatchedTeamRefs.length,
  unmatchedTeamRows: unmatchedTeamRefs.length,
  distinctUnmatchedReferences: new Set(unmatchedTeamRefs).size,
  unmatchedUuidLikeReferences: unmatchedTeamRefs.filter((value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)).length,
  unmatchedNonUuidReferences: unmatchedTeamRefs.filter((value) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)).length,
  orphanTeamsWithRegistrationReference: orphanTeamRows.filter((team) => team.registration_id !== null && team.registration_id !== '').length,
  orphanTeamsWithResolvableRegistration: orphanTeamRows.filter((team) => team.registration_id !== null && registrationIds.has(team.registration_id)).length,
  orphanTeamsWithoutRegistrationReference: orphanTeamRows.filter((team) => team.registration_id === null || team.registration_id === '').length,
};
references.push([
  'teams.event_id → events.id or events.slug',
  countMissingReference(tableRows('teams'), eventIdsOrSlugs, 'event_id'),
]);

const uniqueChecks = [
  ['departments.code', tableRows('departments'), 'code'],
  ['events.id', tableRows('events'), 'id'],
  ['events.slug', tableRows('events'), 'slug'],
  ['profiles.id', tableRows('profiles'), 'id'],
  ['profiles.roll_number (case-insensitive)', tableRows('profiles'), 'roll_number', (value) => value.toUpperCase()],
  ['registrations.id', tableRows('registrations'), 'id'],
  ['registrations.display_id', tableRows('registrations'), 'display_id'],
  ['tickets.registration_id', tableRows('tickets'), 'registration_id'],
  ['tickets.qr_token', tableRows('tickets'), 'qr_token'],
  ['teams.id', tableRows('teams'), 'id'],
  ['teams.team_code', tableRows('teams'), 'team_code', (value) => value.toUpperCase()],
  ['razorpay_orders.receipt', tableRows('razorpay_orders'), 'receipt'],
];
const duplicates = uniqueChecks.map(([name, rows, field, normalize]) => ({
  name,
  duplicateCount: duplicateCount(rows, field, normalize),
}));

const rowCounts = Object.fromEntries([...parsed.tables.entries()].map(([name, table]) => [name, table.rows.length]));
const totalRows = Object.values(rowCounts).reduce((sum, count) => sum + count, 0);
const uriFound = /postgres(?:ql)?:\/\/[^\s]+/i.test(schemaText) || /postgres(?:ql)?:\/\/[^\s]+/i.test(dataText);
const missingReferenceFindings = references.filter(([, count]) => count > 0).map(([name, count]) => ({ name, count }));
const blockingReferenceFindings = missingReferenceFindings.filter(
  (finding) => finding.name !== 'teams.event_id → events.id or events.slug',
);
const report = {
  schemaTableCount: schemaTables.length,
  copyBlockCount: parsed.copyBlocks,
  tablesMissingDataBlocks: schemaTables.filter((name) => !parsed.tables.has(name)),
  rowCounts,
  totalRows,
  teamEventReferenceDiagnostics,
  copyColumnMismatches: parsed.columnMismatches,
  missingReferences: missingReferenceFindings,
  blockingReferenceFindings,
  teamOrphansRequirePrivateArchive: teamEventReferenceDiagnostics.unmatchedTeamRows,
  duplicateUniqueKeys: duplicates.filter((item) => item.duplicateCount > 0),
  connectionUriFound: uriFound,
};

const oldManifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
function fileRecord(filePath) {
  const contents = fs.readFileSync(filePath);
  return {
    sha256: createHash('sha256').update(contents).digest('hex').toUpperCase(),
    bytes: contents.length,
  };
}
const manifest = {
  ...oldManifest,
  files: {
    ...oldManifest.files,
    schema: fileRecord(schemaPath),
    data: fileRecord(dataPath),
  },
  validation: report,
  validatedAtUtc: new Date().toISOString(),
};
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });

console.log(JSON.stringify({
  schemaTableCount: report.schemaTableCount,
  copyBlockCount: report.copyBlockCount,
  totalRows,
  teamEventReferenceDiagnostics,
  columnMismatches: report.copyColumnMismatches,
  blockingReferenceCount: report.blockingReferenceFindings.length,
  teamOrphansToArchive: report.teamOrphansRequirePrivateArchive,
  duplicateKeyCount: report.duplicateUniqueKeys.length,
  connectionUriFound: report.connectionUriFound,
  validationManifest: manifestPath,
}, null, 2));

if (
  report.schemaTableCount !== 17
  || report.copyBlockCount !== 17
  || report.tablesMissingDataBlocks.length > 0
  || report.copyColumnMismatches > 0
  || report.blockingReferenceFindings.length > 0
  || report.duplicateUniqueKeys.length > 0
  || report.connectionUriFound
) {
  process.exitCode = 1;
}
