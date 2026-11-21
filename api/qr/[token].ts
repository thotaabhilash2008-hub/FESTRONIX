import { toBuffer } from 'qrcode';

export const config = { api: { bodyParser: false } };

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{6,120}$/;

type QrRequest = {
  method?: string;
  query: { token?: string | string[] };
};

type QrResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => QrResponse;
  json: (body: unknown) => void;
  send: (body: Buffer) => void;
  end: () => void;
};

export default async function handler(request: QrRequest, response: QrResponse): Promise<void> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD');
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const rawToken = request.query.token;
  const rawValue = Array.isArray(rawToken) ? rawToken[0] : rawToken;
  // Email image URLs use a .png suffix; Vercel passes it as part of [token].
  const token = rawValue?.endsWith('.png') ? rawValue.slice(0, -4) : rawValue;
  if (!token || !TOKEN_PATTERN.test(token)) {
    response.status(400).json({ error: 'Invalid QR token.' });
    return;
  }

  try {
    const png = await toBuffer(token, {
      width: 420,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#07111F', light: '#FFFFFF' },
    });
    response.setHeader('Content-Type', 'image/png');
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    response.status(200);
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    response.send(png);
  } catch {
    response.status(500).json({ error: 'The QR image could not be generated.' });
  }
}
