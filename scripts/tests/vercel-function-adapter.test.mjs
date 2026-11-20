import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import { test } from 'node:test';

process.env.FIREBASE_PROJECT_ID ||= 'festronix-migration-stg26';
delete process.env.VERCEL;

const { default: handler } = await import('../../api/functions/[name].ts');

class FakeResponse extends EventEmitter {
  headers = {};
  statusCode = 200;
  headersSent = false;
  payload;

  setHeader(name, value) { this.headers[name.toLowerCase()] = value; return this; }
  getHeader(name) { return this.headers[name.toLowerCase()]; }
  status(code) { this.statusCode = code; return this; }
  send(value) { this.payload = value; this.headersSent = true; this.emit('finish'); return this; }
  json(value) { this.payload = value; this.headersSent = true; this.emit('finish'); return this; }
  write(value) { this.payload = `${this.payload || ''}${value}`; return true; }
  end(value) { if (value) this.write(value); this.headersSent = true; this.emit('finish'); return this; }
}

function makeRequest(name, body, headers = {}) {
  const raw = Buffer.from(JSON.stringify(body));
  const request = Readable.from(raw.length ? [raw] : []);
  Object.assign(request, {
    method: 'POST',
    url: `/api/functions/${name}`,
    query: { name },
    headers: { 'content-type': 'application/json', origin: 'https://festronix.com', ...headers },
  });
  return request;
}

test('callable endpoint uses Firebase callable envelope and rejects missing staff auth', async () => {
  const request = makeRequest('getStaffAccess', { data: {} });
  const response = new FakeResponse();
  await handler(request, response);

  assert.equal(response.statusCode, 401);
  assert.equal(response.payload.error.status, 'UNAUTHENTICATED');
});

test('Razorpay webhook receives the original request bytes and rejects missing signature', async () => {
  const request = makeRequest('razorpayWebhook', {});
  const response = new FakeResponse();
  await handler(request, response);

  assert.equal(response.statusCode, 400);
  assert.match(String(response.payload), /Webhook signature or body is missing/);
});

test('pass-email resend endpoint is registered with the Vercel adapter', async () => {
  const request = makeRequest('resendRegistrationPassEmail', {});
  request.method = 'OPTIONS';
  const response = new FakeResponse();
  await handler(request, response);

  assert.equal(response.statusCode, 204, String(response.payload));
});

test('pass-email resend endpoint rejects non-POST requests', async () => {
  const request = makeRequest('resendRegistrationPassEmail', {});
  request.method = 'GET';
  const response = new FakeResponse();
  await handler(request, response);

  assert.equal(response.statusCode, 405);
  assert.match(String(response.payload?.error || response.payload), /Method not allowed/);
});

test('unknown operations are rejected before dispatch', async () => {
  const request = makeRequest('deleteEverything', {});
  const response = new FakeResponse();
  await handler(request, response);

  assert.equal(response.statusCode, 404);
  assert.equal(response.payload.error, 'Unknown API operation.');
});
