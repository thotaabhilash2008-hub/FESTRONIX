import { handleFirebaseFunctionRequest } from './handler.mjs'
import type { FirebaseApiRequest, FirebaseApiResponse } from './handler.mjs'

export const config = { api: { bodyParser: false } }

export default async function handler(request: FirebaseApiRequest, response: FirebaseApiResponse): Promise<void> {
  await handleFirebaseFunctionRequest(request, response)
}
