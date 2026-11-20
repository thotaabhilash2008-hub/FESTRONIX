import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const migrationRoot = path.join(
  process.env.LOCALAPPDATA ?? '',
  'FestronixMigration',
);
const sourceDirectory = path.join(migrationRoot, 'supabase-auth-export');
const outputDirectory = path.join(migrationRoot, 'firebase-auth-staging');
const usersPath = path.join(sourceDirectory, 'auth-users.ndjson');
const identitiesPath = path.join(sourceDirectory, 'auth-identities.ndjson');
const sourceManifestPath = path.join(sourceDirectory, 'manifest.json');

function sha256(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex').toUpperCase();
}

function readNdjson(filePath) {
  const contents = fs.readFileSync(filePath, 'utf8').trim();
  if (!contents) return [];
  return contents.split(/\r?\n/).map((line, index) => {
    try {
      return JSON.parse(line);
    } catch {
      throw new Error(`Invalid JSON record at ${path.basename(filePath)} line ${index + 1}.`);
    }
  });
}

function requireUnique(values, label) {
  if (values.some((value) => !value)) throw new Error(`Some source accounts have no ${label}.`);
  if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label}s exist in the source export.`);
}

function safeMillis(value, label, uid) {
  if (value == null) return undefined;
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) {
    throw new Error(`Invalid ${label} timestamp found for source account ${uid}.`);
  }
  return number;
}

function currentBanIsActive(value) {
  if (value == null) return false;
  const expiry = Date.parse(value);
  if (!Number.isFinite(expiry)) throw new Error('An account has an unreadable ban expiry timestamp.');
  return expiry > Date.now();
}

function main() {
  for (const filePath of [usersPath, identitiesPath, sourceManifestPath]) {
    if (!fs.existsSync(filePath)) {
      throw new Error('The Supabase Auth export is incomplete. Rerun the read-only Auth export first.');
    }
  }

  const sourceManifest = JSON.parse(fs.readFileSync(sourceManifestPath, 'utf8'));
  if (sha256(usersPath) !== sourceManifest.files?.users?.sha256
    || sha256(identitiesPath) !== sourceManifest.files?.identities?.sha256) {
    throw new Error('The Supabase Auth export no longer matches its SHA-256 manifest.');
  }

  const sourceUsers = readNdjson(usersPath);
  const sourceIdentities = readNdjson(identitiesPath);
  if (sourceUsers.length !== sourceManifest.userCount
    || sourceIdentities.length !== sourceManifest.identityCount) {
    throw new Error('The Supabase Auth export counts do not match its manifest.');
  }

  requireUnique(sourceUsers.map((user) => user.uid), 'UID');
  requireUnique(sourceUsers.map((user) => user.email?.trim().toLowerCase()), 'normalized email');

  const identityProviderCounts = new Map();
  const userIdsWithIdentity = new Set();
  for (const identity of sourceIdentities) {
    if (!identity.userId || !identity.provider) throw new Error('An identity record is missing its user or provider.');
    if (!sourceUsers.some((user) => user.uid === identity.userId)) {
      throw new Error('An identity record references an account absent from the Auth export.');
    }
    userIdsWithIdentity.add(identity.userId);
    identityProviderCounts.set(identity.provider, (identityProviderCounts.get(identity.provider) ?? 0) + 1);
  }
  const unsupportedProviders = [...identityProviderCounts.keys()].filter((provider) => provider !== 'email');
  if (unsupportedProviders.length) {
    throw new Error('Non-email identity providers need an explicit Firebase provider mapping before import.');
  }

  const now = Date.now();
  let passwordlessCount = 0;
  let disabledCount = 0;
  let activeBanCount = 0;
  const firebaseUsers = sourceUsers.map((user) => {
    if (!user.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email.trim())) {
      throw new Error(`An account has a missing or invalid email (source account ${user.uid}).`);
    }
    if (user.isAnonymous || user.isSsoUser) {
      throw new Error('Anonymous or SSO accounts require a separate import plan.');
    }

    const imported = {
      localId: user.uid,
      email: user.email.trim(),
      emailVerified: Boolean(user.emailVerified),
      disabled: Boolean(user.deletedAt != null || currentBanIsActive(user.bannedUntil)),
    };
    if (user.displayName) imported.displayName = user.displayName;
    if (user.photoUrl) imported.photoUrl = user.photoUrl;

    const createdAt = safeMillis(user.createdAt, 'createdAt', user.uid);
    const lastSignedInAt = safeMillis(user.lastSignedInAt, 'lastSignedInAt', user.uid);
    if (createdAt !== undefined) imported.createdAt = createdAt;
    if (lastSignedInAt !== undefined) imported.lastSignedInAt = lastSignedInAt;

    if (user.phoneNumber) {
      if (!/^\+[1-9]\d{1,14}$/.test(user.phoneNumber)) {
        throw new Error(`A phone number is not in E.164 format (source account ${user.uid}).`);
      }
      imported.phoneNumber = user.phoneNumber;
    }

    if (user.passwordHashBase64) {
      // PostgreSQL's base64 encoder wraps long values with newlines. Firebase
      // CLI's JSON importer requires a single-line base64 string.
      const passwordHashBase64 = user.passwordHashBase64.replace(/\s+/g, '');
      if (Buffer.from(passwordHashBase64, 'base64').toString('base64') !== passwordHashBase64) {
        throw new Error(`An account has a malformed base64 password hash (source account ${user.uid}).`);
      }
      const hash = Buffer.from(passwordHashBase64, 'base64').toString('utf8');
      if (!/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hash)) {
        throw new Error(`An account has a malformed bcrypt hash (source account ${user.uid}).`);
      }
      imported.passwordHash = passwordHashBase64;
    } else {
      passwordlessCount += 1;
    }

    const isActiveBan = currentBanIsActive(user.bannedUntil);
    if (isActiveBan) activeBanCount += 1;
    if (imported.disabled) disabledCount += 1;
    return imported;
  });

  if (firebaseUsers.length !== sourceUsers.length || userIdsWithIdentity.size !== sourceUsers.length) {
    throw new Error('Auth identity linkage checks failed.');
  }

  fs.mkdirSync(outputDirectory, { recursive: true, mode: 0o700 });
  const outputPath = path.join(outputDirectory, 'firebase-auth-import.json');
  const manifestPath = path.join(outputDirectory, 'firebase-auth-import-manifest.json');
  const serializedUsers = `${JSON.stringify({ users: firebaseUsers }, null, 2)}\n`;
  fs.writeFileSync(outputPath, serializedUsers, { encoding: 'utf8', mode: 0o600 });
  const manifest = {
    targetProjectId: 'festronix-migration-stg26',
    sourceProjectRef: sourceManifest.sourceProjectRef,
    preparedAtUtc: new Date(now).toISOString(),
    sourceUserCount: sourceUsers.length,
    importedUserCount: firebaseUsers.length,
    identityCount: sourceIdentities.length,
    passwordlessAccountCount: passwordlessCount,
    currentlyBannedAccountCount: activeBanCount,
    disabledAccountCount: disabledCount,
    duplicateUidGroups: 0,
    duplicateEmailGroups: 0,
    unsupportedIdentityProviders: [],
    bcryptHashAlgorithm: 'BCRYPT',
    importFileSha256: sha256(outputPath),
    importApplied: false,
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });

  console.log(`Prepared Firebase Auth staging import: ${firebaseUsers.length} users.`);
  console.log(`Passwordless accounts: ${passwordlessCount}; currently banned and imported disabled: ${activeBanCount}.`);
  console.log(`Source UIDs and unique emails verified; provider mapping: email only.`);
  console.log(`Sensitive import file is stored under: ${outputDirectory}`);
  console.log('No account email, UID, password hash, or database URI was printed. No Firebase data was changed.');
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
