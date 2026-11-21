import * as firebaseHandlers from '../../functions/lib/index.js';

const callableFunctions = new Set([
  'approveStaffEvent', 'checkInStaffRegistration', 'createFreeRegistrations', 'createStaffEvent',
  'createStaffSpotRegistration', 'deleteStaffEvent', 'findPublicTeam',
  'getStaffAccess', 'getStaffEvent', 'listPublicAnnouncements', 'listPublicDepartments', 'listPublicEvents',
  'listPublicSponsorProfiles', 'listStaffEvents', 'listStaffRazorpayRefundOrders',
  'listStaffRegistrations', 'listStaffTeams', 'manageAnnouncement', 'manageDepartment',
  'manageSponsorProfile', 'manageStaffAccount',
  'reviewStaffRegistrationPayment', 'toggleStaffCheckIn', 'updateStaffEvent',
]);

const httpFunctions = new Set([
  'createRazorpayOrder', 'lookupPublicPasses', 'razorpayWebhook', 'resendRegistrationPassEmail',
  'sendRegistrationPassEmail', 'verifyRazorpayPayment',
]);

const allowedFunctions = new Set([...callableFunctions, ...httpFunctions]);

async function readBody(request) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > 4 * 1024 * 1024) throw new Error('Request body is too large.');
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

function requestHeader(request, name) {
  const value = request.headers[name.toLowerCase()];
  return Array.isArray(value) ? value.join(', ') : value;
}

function allowApexOrigin(request, response) {
  const origin = requestHeader(request, 'origin');
  if (origin !== 'https://festronix.com') return;
  response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.setHeader('Vary', 'Origin');
}

function attachExpressCompatibility(request, rawBody, body) {
  const facade = Object.create(request);
  const forwardedFor = requestHeader(request, 'x-vercel-forwarded-for') || requestHeader(request, 'x-forwarded-for');
  Object.defineProperties(facade, {
    body: { value: body, enumerable: true },
    rawBody: { value: rawBody, enumerable: true },
    ip: { value: forwardedFor?.split(',')[0]?.trim() || undefined, enumerable: true },
    header: { value: name => requestHeader(request, name) },
    get: { value: name => requestHeader(request, name) },
  });
  return facade;
}

function attachExpressResponseCompatibility(response) {
  if (typeof response.set !== 'function') {
    response.set = (name, value) => {
      response.setHeader(name, value);
      return response;
    };
  }
  return response;
}

export async function handleFirebaseFunctionRequest(request, response) {
  allowApexOrigin(request, response);
  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  const requestedName = request.query?.name;
  const name = Array.isArray(requestedName) ? requestedName[0] : requestedName;
  if (!name || !allowedFunctions.has(name)) {
    response.status(404).json({ error: 'Unknown API operation.' });
    return;
  }
  if (request.method !== 'POST' && request.method !== 'OPTIONS') {
    response.setHeader('Allow', 'POST, OPTIONS');
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  let rawBody;
  let body;
  try {
    rawBody = await readBody(request);
    body = rawBody.length ? JSON.parse(rawBody.toString('utf8')) : {};
  } catch (error) {
    const tooLarge = error instanceof Error && error.message === 'Request body is too large.';
    response.status(tooLarge ? 413 : 400).json({ error: tooLarge ? error.message : 'Request body must be valid JSON.' });
    return;
  }

  if (callableFunctions.has(name) && (!body || typeof body !== 'object')) {
    response.status(400).json({ error: { status: 'INVALID_ARGUMENT', message: 'Callable request body is invalid.' } });
    return;
  }

  const target = firebaseHandlers[name];
  if (typeof target !== 'function') {
    response.status(503).json({ error: 'The server operation is not built for this deployment.' });
    return;
  }

  try {
    await target(
      attachExpressCompatibility(request, rawBody, body),
      attachExpressResponseCompatibility(response),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Firebase operation ${name} failed:`, error);
    if (!response.headersSent) {
      if (/RESOURCE_EXHAUSTED|Quota exceeded/i.test(message)) {
        response.status(503).json({
          error: {
            status: 'RESOURCE_EXHAUSTED',
            message: 'Firebase read quota is temporarily exhausted. Please retry shortly; if it continues, an administrator must raise the Firestore quota.',
          },
        });
        return;
      }
      response.status(500).json({ error: { status: 'INTERNAL', message } });
    }
  }
}
