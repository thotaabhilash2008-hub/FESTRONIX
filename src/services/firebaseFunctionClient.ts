import { getAuth } from 'firebase/auth';
import { firebaseApp } from '../lib/firebase';

type CallableErrorPayload = {
  status?: string;
  message?: string;
  details?: unknown;
};

type ApiResponse<T> = {
  result?: T;
  success?: boolean;
  error?: string | CallableErrorPayload;
};

function apiUrl(name: string): string {
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name)) throw new Error('Invalid Firebase API operation.');
  const path = `/api/functions/${encodeURIComponent(name)}`;
  // The apex domain has its own browser storage and edge cache. Firebase
  // callable verification is identical on www, so route apex API traffic there
  // while keeping the visitor on the address they opened.
  if (typeof window !== 'undefined' && window.location.hostname === 'festronix.com') {
    return `https://www.festronix.com${path}`;
  }
  return path;
}

function toCallableError(payload: ApiResponse<unknown>, fallback: string, statusCode: number): Error & { code: string } {
  const errorPayload = payload.error;
  const status = typeof errorPayload === 'object' && errorPayload
    ? String(errorPayload.status || '')
    : '';
  const message = typeof errorPayload === 'string'
    ? errorPayload
    : typeof errorPayload === 'object' && errorPayload
      ? String(errorPayload.message || '')
      : '';
  const normalizedStatus = status.toLowerCase().replaceAll('_', '-');
  const code = normalizedStatus || (statusCode === 401 ? 'unauthenticated' : statusCode === 403 ? 'permission-denied' : 'internal');
  return Object.assign(new Error(message || fallback), { code: `functions/${code}` });
}

async function post<T>(name: string, body: unknown, callable: boolean): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (callable && firebaseApp) {
    const currentUser = getAuth(firebaseApp).currentUser;
    if (currentUser) headers.Authorization = `Bearer ${await currentUser.getIdToken()}`;
  }

  const response = await fetch(apiUrl(name), {
    method: 'POST',
    headers,
    body: JSON.stringify(callable ? { data: body } : body),
    credentials: 'same-origin',
  });
  const payload = await response.json().catch(() => ({})) as ApiResponse<T>;
  if (!response.ok) throw toCallableError(payload, 'The Firebase API request failed.', response.status);
  return payload;
}

/** Calls the Vercel-hosted API while preserving Firebase callable auth and response semantics. */
export async function callFirebaseCallable<T>(name: string, data: Record<string, unknown> = {}): Promise<T> {
  const payload = await post<T>(name, data, true);
  if (!Object.prototype.hasOwnProperty.call(payload, 'result')) {
    throw toCallableError(payload, 'The Firebase API returned an invalid callable response.', 500);
  }
  return payload.result as T;
}

/** Calls an HTTP-style server operation such as Razorpay, pass lookup, email, or the webhook. */
export async function callFirebaseHttp<T>(name: string, body: unknown): Promise<T> {
  const payload = await post<T>(name, body, false);
  if (payload.success === false) {
    throw toCallableError(payload, 'The Firebase API request failed.', 400);
  }
  return payload as T;
}
