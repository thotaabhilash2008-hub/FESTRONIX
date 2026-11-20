import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const migrationDirectory = path.join(
  process.env.LOCALAPPDATA ?? '',
  'FestronixMigration',
  'supabase-export',
);
const secretPath = path.join(migrationDirectory, 'registration-roll-claim.key');

if (!process.env.LOCALAPPDATA) throw new Error('LOCALAPPDATA is not available.');
fs.mkdirSync(migrationDirectory, { recursive: true });

if (fs.existsSync(secretPath)) {
  const existing = fs.readFileSync(secretPath, 'utf8').trim();
  if (Buffer.byteLength(existing, 'utf8') < 32) {
    throw new Error('The existing registration claim secret is too short; do not replace it without a planned reindex.');
  }
  console.log(`Existing registration claim secret is available at ${secretPath}; it was not changed.`);
} else {
  fs.writeFileSync(secretPath, `${randomBytes(32).toString('base64url')}\n`, {
    encoding: 'utf8',
    flag: 'wx',
    mode: 0o600,
  });
  console.log(`Created a local registration claim secret at ${secretPath}. The secret value was not printed.`);
}
