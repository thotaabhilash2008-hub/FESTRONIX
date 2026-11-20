import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const SOURCE_PROJECT_REF = 'fbvztmttixmmqorvqtbb';
const OUTPUT_DIRECTORY = path.join(
  process.env.LOCALAPPDATA ?? '',
  'FestronixMigration',
  'supabase-auth-export',
);

const usersQuery = `
SELECT jsonb_build_object(
  'uid', u.id::text,
  'email', u.email,
  'emailVerified', (u.email_confirmed_at IS NOT NULL),
  'passwordHashBase64', CASE
    WHEN NULLIF(u.encrypted_password, '') IS NULL THEN NULL
    ELSE encode(convert_to(u.encrypted_password, 'UTF8'), 'base64')
  END,
  'phoneNumber', NULLIF(u.phone, ''),
  'phoneVerified', (u.phone_confirmed_at IS NOT NULL),
  'displayName', COALESCE(NULLIF(u.raw_user_meta_data->>'full_name', ''), NULLIF(u.raw_user_meta_data->>'name', '')),
  'photoUrl', COALESCE(NULLIF(u.raw_user_meta_data->>'avatar_url', ''), NULLIF(u.raw_user_meta_data->>'picture', '')),
  'createdAt', floor(extract(epoch FROM u.created_at) * 1000)::bigint,
  'lastSignedInAt', CASE WHEN u.last_sign_in_at IS NULL THEN NULL ELSE floor(extract(epoch FROM u.last_sign_in_at) * 1000)::bigint END,
  'provider', COALESCE(u.raw_app_meta_data->>'provider', 'email'),
  'providers', COALESCE(u.raw_app_meta_data->'providers', '[]'::jsonb),
  'isAnonymous', COALESCE((to_jsonb(u)->>'is_anonymous')::boolean, false),
  'isSsoUser', COALESCE((to_jsonb(u)->>'is_sso_user')::boolean, false),
  'deletedAt', to_jsonb(u)->'deleted_at',
  'bannedUntil', to_jsonb(u)->'banned_until'
) AS user_record
FROM auth.users AS u
ORDER BY u.id;
`;

const identitiesQuery = `
SELECT jsonb_build_object(
  'id', i.id::text,
  'userId', i.user_id::text,
  'provider', i.provider,
  'providerUserId', COALESCE(i.identity_data->>'sub', i.identity_data->>'user_id', i.identity_data->>'id'),
  'email', i.identity_data->>'email',
  'displayName', COALESCE(i.identity_data->>'full_name', i.identity_data->>'name'),
  'photoUrl', COALESCE(i.identity_data->>'avatar_url', i.identity_data->>'picture'),
  'createdAt', i.created_at,
  'updatedAt', i.updated_at
) AS identity_record
FROM auth.identities AS i
ORDER BY i.user_id, i.provider;
`;

const mfaExistsQuery = "SELECT to_regclass('auth.mfa_factors') IS NOT NULL AS exists;";
const mfaCountsQuery = `
SELECT factor_type AS "factorType", status, count(*)::integer AS count
FROM auth.mfa_factors
GROUP BY factor_type, status
ORDER BY factor_type, status;
`;

function hashFile(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex').toUpperCase();
}

function countDuplicateEmailGroups(users) {
  const frequencies = new Map();
  for (const user of users) {
    if (!user.email) continue;
    const normalized = user.email.trim().toLowerCase();
    frequencies.set(normalized, (frequencies.get(normalized) ?? 0) + 1);
  }
  return [...frequencies.values()].filter((count) => count > 1).length;
}

function sanitizeError(error, password) {
  let message = String(error?.message ?? 'Unknown connection or query error');
  if (password) message = message.replaceAll(password, '[password hidden]');
  message = message.replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, '[connection hidden]');
  return message.replace(/\s+/g, ' ').slice(0, 500);
}

async function main() {
  const databaseUri = process.env.FESTRONIX_SUPABASE_DATABASE_URI;
  delete process.env.FESTRONIX_SUPABASE_DATABASE_URI;
  if (!databaseUri) throw new Error('The PowerShell wrapper did not provide the hidden database URI.');

  let url;
  try {
    url = new URL(databaseUri);
  } catch {
    throw new Error('The supplied database URI is invalid.');
  }
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('Only a PostgreSQL connection URI is accepted.');
  }
  const host = url.hostname.toLowerCase();
  if (!(host.endsWith('.supabase.co') || host.endsWith('.pooler.supabase.com'))) {
    throw new Error('The URI host is not a Supabase database or pooler host.');
  }

  const username = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!username || !password || !database) {
    throw new Error('The PostgreSQL URI must include its username, password, and database name.');
  }

  const { Client } = pg;
  const client = new Client({
    host,
    port: url.port ? Number(url.port) : 5432,
    user: username,
    password,
    database,
    ssl: { rejectUnauthorized: true },
    connectionTimeoutMillis: 20_000,
    application_name: 'festronix-readonly-auth-export',
    options: '-c default_transaction_read_only=on',
  });

  let transactionOpen = false;
  try {
    await client.connect();
    await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
    transactionOpen = true;

    const [{ rows: userRows }, { rows: identityRows }] = await Promise.all([
      client.query(usersQuery),
      client.query(identitiesQuery),
    ]);
    const users = userRows.map((row) => row.user_record);
    const identities = identityRows.map((row) => row.identity_record);

    const mfaTable = await client.query(mfaExistsQuery);
    const mfaFactorCounts = mfaTable.rows[0]?.exists
      ? (await client.query(mfaCountsQuery)).rows
      : [];

    await client.query('COMMIT');
    transactionOpen = false;

    const malformedBcryptHashCount = users.filter((user) => {
      if (!user.passwordHashBase64) return false;
      const hash = Buffer.from(user.passwordHashBase64, 'base64').toString('utf8');
      return !/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hash);
    }).length;
    const usersMissingPasswordHash = users.filter((user) => !user.passwordHashBase64).length;
    const identitiesByProvider = new Map();
    for (const identity of identities) {
      identitiesByProvider.set(identity.provider, (identitiesByProvider.get(identity.provider) ?? 0) + 1);
    }
    const providerCounts = [...identitiesByProvider.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([provider, count]) => ({ provider, count }));
    const mfaFactorTotal = mfaFactorCounts.reduce((total, row) => total + Number(row.count), 0);

    fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true, mode: 0o700 });
    const usersPath = path.join(OUTPUT_DIRECTORY, 'auth-users.ndjson');
    const identitiesPath = path.join(OUTPUT_DIRECTORY, 'auth-identities.ndjson');
    const manifestPath = path.join(OUTPUT_DIRECTORY, 'manifest.json');
    const usersContent = `${users.map((user) => JSON.stringify(user)).join('\n')}\n`;
    const identitiesContent = `${identities.map((identity) => JSON.stringify(identity)).join('\n')}\n`;
    fs.writeFileSync(usersPath, usersContent, { encoding: 'utf8', mode: 0o600 });
    fs.writeFileSync(identitiesPath, identitiesContent, { encoding: 'utf8', mode: 0o600 });

    const manifest = {
      sourceProjectRef: SOURCE_PROJECT_REF,
      capturedAtUtc: new Date().toISOString(),
      userCount: users.length,
      identityCount: identities.length,
      usersMissingPasswordHash,
      malformedBcryptHashCount,
      duplicateEmailGroupCount: countDuplicateEmailGroups(users),
      providerCounts,
      mfaFactorCounts,
      mfaFactorTotal,
      connectionUriStored: false,
      passwordHashesExported: true,
      files: {
        users: { name: path.basename(usersPath), sha256: hashFile(usersPath) },
        identities: { name: path.basename(identitiesPath), sha256: hashFile(identitiesPath) },
      },
    };
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });

    console.log(`Secure Auth export saved under: ${OUTPUT_DIRECTORY}`);
    console.log(`Accounts: ${users.length}; linked identities: ${identities.length}; duplicate email groups: ${manifest.duplicateEmailGroupCount}`);
    console.log(`Accounts without password hashes: ${usersMissingPasswordHash}; malformed bcrypt hashes: ${malformedBcryptHashCount}`);
    console.log(`Provider types: ${providerCounts.map(({ provider, count }) => `${provider}=${count}`).join(', ') || 'none'}`);
    console.log(`MFA factors inventoried (factor secrets are not exported): ${mfaFactorTotal}`);
    console.log('No account emails, password hashes, identity details, or database URI were printed.');
  } catch (error) {
    if (transactionOpen) await client.query('ROLLBACK').catch(() => {});
    throw new Error(`Read-only Supabase Auth export failed: ${sanitizeError(error, password)}`);
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
