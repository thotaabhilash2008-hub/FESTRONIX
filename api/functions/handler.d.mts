import type { VercelRequest, VercelResponse } from '@vercel/node'

export function handleFirebaseFunctionRequest(request: VercelRequest, response: VercelResponse): Promise<void>
