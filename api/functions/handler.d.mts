import type { IncomingMessage, ServerResponse } from 'node:http'

export type FirebaseApiRequest = IncomingMessage & {
  query?: Record<string, string | string[] | undefined>
}

export type FirebaseApiResponse = ServerResponse & {
  status(code: number): this
  json(value: unknown): this
  send(value: string | Buffer): this
  set(name: string, value: string): this
}

export function handleFirebaseFunctionRequest(request: FirebaseApiRequest, response: FirebaseApiResponse): Promise<void>
