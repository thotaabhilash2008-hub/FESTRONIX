const FIRESTORE_SCOPE = 'https://www.googleapis.com/auth/datastore';
const TOKEN_AUDIENCE = 'https://oauth2.googleapis.com/token';
const ALLOWED_COLLECTIONS = new Set([
  'profiles', 'departments', 'adminRoles', 'adminEventAssignments', 'events', 'publicEvents',
  'registrations', 'registrationMembers', 'tickets', 'paymentProofs', 'announcements',
  'auditLogs', 'certificates', 'sponsors', 'sponsorProfiles', 'teams', 'paymentOrders',
  'emailDeliveries', 'legacyOrphanTeams',
]);

function encodeBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function utf8(value) {
  return new TextEncoder().encode(value);
}

function decodePem(pem) {
  const base64 = pem
    .replace(/\\n/gu, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/gu, '')
    .replace(/-----END PRIVATE KEY-----/gu, '')
    .replace(/\s/gu, '');
  const binary = atob(base64);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function validateProjectId(projectId) {
  if (typeof projectId !== 'string' || !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/u.test(projectId)) {
    throw new Error('Firebase project configuration is invalid.');
  }
}

function validateReference(collection, id) {
  if (!ALLOWED_COLLECTIONS.has(collection)) throw new Error('Firestore collection is not allowlisted.');
  if (typeof id !== 'string' || id.length === 0 || id.length > 1500 || id.includes('/') || id.includes('\0')) {
    throw new Error('Firestore document identifier is invalid.');
  }
  return `${collection}/${encodeURIComponent(id)}`;
}

function safeEmulatorBaseUrl(host) {
  if (typeof host !== 'string' || !host.trim()) return undefined;
  const parsed = new URL(`http://${host.trim()}`);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)) {
    throw new Error('Firestore emulator host must be loopback-only.');
  }
  return `${parsed.origin}/v1`;
}

/**
 * Firestore REST client for offline migration and staging administration scripts.
 * Callers must authenticate and authorize every request before using it.
 * Firebase security rules do not protect requests made with the service identity.
 */
export function createFirebaseFirestoreClient({
  projectId,
  serviceAccountEmail,
  privateKey,
  emulatorHost,
  fetchImpl = fetch,
  now = () => Date.now(),
}) {
  validateProjectId(projectId);
  const emulatorBase = safeEmulatorBaseUrl(emulatorHost);
  if (!emulatorBase && (
    typeof serviceAccountEmail !== 'string' ||
    !serviceAccountEmail.includes('@') ||
    typeof privateKey !== 'string' ||
    !privateKey.includes('PRIVATE KEY')
  )) {
    throw new Error('Firebase server credentials are not configured.');
  }

  const documentsBase = `${emulatorBase ?? 'https://firestore.googleapis.com/v1'}/projects/${encodeURIComponent(projectId)}/databases/(default)/documents`;
  let cachedToken;
  let cachedTokenExpiresAt = 0;

  async function getAccessToken() {
    if (emulatorBase) return 'owner';
    if (cachedToken && cachedTokenExpiresAt - now() > 60_000) return cachedToken;

    const issuedAt = Math.floor(now() / 1000);
    const header = encodeBase64Url(utf8(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
    const claims = encodeBase64Url(utf8(JSON.stringify({
      iss: serviceAccountEmail,
      sub: serviceAccountEmail,
      aud: TOKEN_AUDIENCE,
      scope: FIRESTORE_SCOPE,
      iat: issuedAt,
      exp: issuedAt + 3600,
    })));
    const signingInput = `${header}.${claims}`;
    const key = await crypto.subtle.importKey(
      'pkcs8',
      decodePem(privateKey),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, utf8(signingInput));
    const assertion = `${signingInput}.${encodeBase64Url(new Uint8Array(signature))}`;
    const response = await fetchImpl(TOKEN_AUDIENCE, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Google OAuth token exchange failed (HTTP ${response.status}).`);

    const tokenResponse = await response.json();
    if (
      typeof tokenResponse.access_token !== 'string' ||
      !Number.isFinite(Number(tokenResponse.expires_in))
    ) {
      throw new Error('Google OAuth returned an invalid access token response.');
    }
    cachedToken = tokenResponse.access_token;
    cachedTokenExpiresAt = now() + Number(tokenResponse.expires_in) * 1000;
    return cachedToken;
  }

  async function request(resource, { method = 'GET', body, allowNotFound = false } = {}) {
    const token = await getAccessToken();
    const response = await fetchImpl(`${documentsBase}${resource}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(20_000),
    });
    if (allowNotFound && response.status === 404) return null;
    if (response.status === 204) return {};
    let result;
    try {
      result = await response.json();
    } catch {
      result = undefined;
    }
    if (!response.ok) {
      const apiStatus = typeof result?.error?.status === 'string' ? result.error.status : 'UNKNOWN';
      const error = new Error(`Firestore REST request failed (HTTP ${response.status}, ${apiStatus}).`);
      error.httpStatus = response.status;
      error.apiStatus = apiStatus;
      throw error;
    }
    return result ?? {};
  }

  function documentName(collection, id) {
    return `projects/${projectId}/databases/(default)/documents/${validateReference(collection, id)}`;
  }

  async function getDocument(collection, id) {
    const resource = `/${validateReference(collection, id)}`;
    return request(resource, { allowNotFound: true });
  }

  async function runTransaction(readReferences, buildWrites, { maxAttempts = 3 } = {}) {
    if (!Array.isArray(readReferences) || readReferences.length === 0 || readReferences.length > 100) {
      throw new Error('Firestore transaction must read between 1 and 100 documents.');
    }
    if (typeof buildWrites !== 'function') throw new Error('Firestore transaction write builder is required.');
    if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 5) {
      throw new Error('Firestore transaction retry count is invalid.');
    }

    const refs = readReferences.map(reference => ({
      key: `${reference.collection}/${reference.id}`,
      name: documentName(reference.collection, reference.id),
    }));
    if (new Set(refs.map(reference => reference.name)).size !== refs.length) {
      throw new Error('Firestore transaction contains duplicate read documents.');
    }

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      let transactionId;
      try {
        const started = await request(':beginTransaction', {
          method: 'POST',
          body: { options: { readWrite: {} } },
        });
        transactionId = started.transaction;
        if (typeof transactionId !== 'string' || !transactionId) {
          throw new Error('Firestore did not return a transaction identifier.');
        }

        const batch = await request(':batchGet', {
          method: 'POST',
          body: { documents: refs.map(reference => reference.name), transaction: transactionId },
        });
        if (!Array.isArray(batch)) throw new Error('Firestore returned an invalid transaction read.');
        const snapshots = new Map(refs.map(reference => [reference.key, null]));
        for (const item of batch) {
          const document = item.found;
          if (!document || typeof document.name !== 'string') continue;
          const reference = refs.find(candidate => candidate.name === document.name);
          if (reference) snapshots.set(reference.key, document);
        }

        const writes = await buildWrites({
          get(collection, id) {
            const key = `${collection}/${id}`;
            if (!snapshots.has(key)) throw new Error('Transaction attempted to read a document outside its declared read set.');
            return snapshots.get(key);
          },
        });
        if (!Array.isArray(writes) || writes.length > 500) {
          throw new Error('Firestore transaction writes must be an array with at most 500 entries.');
        }
        if (writes.length === 0) {
          await request(':rollback', { method: 'POST', body: { transaction: transactionId } });
          return { snapshots, commit: null, attempts: attempt };
        }
        for (const write of writes) {
          const writeName = write?.update?.name ?? write?.delete;
          if (typeof writeName !== 'string' || !writeName.startsWith(`projects/${projectId}/databases/(default)/documents/`)) {
            throw new Error('Firestore transaction contains an invalid write target.');
          }
          const relativePath = writeName.split('/documents/')[1];
          const [collection, ...documentIdParts] = relativePath?.split('/') ?? [];
          if (!ALLOWED_COLLECTIONS.has(collection) || documentIdParts.length !== 1 || !documentIdParts[0]) {
            throw new Error('Firestore transaction write target is outside the application collections.');
          }
          validateReference(collection, decodeURIComponent(documentIdParts[0]));
        }

        const committed = await request(':commit', {
          method: 'POST',
          body: { writes, transaction: transactionId },
        });
        return { snapshots, commit: committed, attempts: attempt };
      } catch (error) {
        if (transactionId) {
          await request(':rollback', { method: 'POST', body: { transaction: transactionId } }).catch(() => {});
        }
        if (error?.apiStatus === 'ABORTED' && attempt < maxAttempts) continue;
        throw error;
      }
    }
    throw new Error('Firestore transaction retry limit reached.');
  }

  return Object.freeze({ getDocument, runTransaction });
}
