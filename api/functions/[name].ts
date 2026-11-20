import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleFirebaseFunctionRequest } from './handler.mjs'

export const config = { api: { bodyParser: false } }

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  await handleFirebaseFunctionRequest(request, response)
}
