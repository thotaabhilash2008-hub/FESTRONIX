import type { IncomingMessage, ServerResponse } from 'node:http'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

type QueryRequest = IncomingMessage & {
  query: Record<string, string | string[]>
}

type ExpressResponse = ServerResponse & {
  status: (code: number) => ExpressResponse
  json: (value: unknown) => ExpressResponse
  send: (value: string | Buffer) => ExpressResponse
}

function firebaseApiDevPlugin(): Plugin {
  return {
    name: 'festronix-firebase-api-dev',
    configureServer(server) {
      type FirebaseApiHandler = (request: VercelRequest, response: VercelResponse) => Promise<void>
      const handlerUrl = pathToFileURL(resolve(process.cwd(), 'api/functions/handler.mjs')).href
      let handlerPromise: Promise<FirebaseApiHandler> | undefined
      server.middlewares.use((request, response, next) => {
        const url = new URL(request.url || '/', 'http://localhost')
        const prefix = '/api/functions/'
        if (!url.pathname.startsWith(prefix)) {
          next()
          return
        }

        const name = decodeURIComponent(url.pathname.slice(prefix.length))
        if (!name || name.includes('/')) {
          response.statusCode = 404
          response.end(JSON.stringify({ error: 'Unknown API operation.' }))
          return
        }

        const query: Record<string, string | string[]> = {}
        for (const [key, value] of url.searchParams) {
          const previous = query[key]
          query[key] = previous === undefined ? value : Array.isArray(previous) ? [...previous, value] : [previous, value]
        }
        query.name = name
        ;(request as QueryRequest).query = query

        const expressResponse = response as ExpressResponse
        expressResponse.status = function status(code) {
          this.statusCode = code
          return this
        }
        expressResponse.json = function json(value) {
          if (!this.headersSent) this.setHeader('Content-Type', 'application/json; charset=utf-8')
          this.end(JSON.stringify(value))
          return this
        }
        expressResponse.send = function send(value) {
          if (value !== null && typeof value === 'object' && !Buffer.isBuffer(value)) {
            return this.json(value)
          }
          this.end(value)
          return this
        }

        if (!handlerPromise) {
          const loadNativeModule = new Function('url', 'return import(url)') as (
            url: string,
          ) => Promise<{ handleFirebaseFunctionRequest: FirebaseApiHandler }>
          handlerPromise = loadNativeModule(handlerUrl).then(module => module.handleFirebaseFunctionRequest)
        }
        void handlerPromise.then(handler => handler(
          request as unknown as VercelRequest,
          expressResponse as unknown as VercelResponse,
        )).catch(error => {
          // Keep the browser response generic while exposing the local adapter error in dev logs.
          console.error('[local Firebase API] request handler failed:', error instanceof Error ? error.message : String(error))
          if (response.headersSent) {
            response.destroy()
            return
          }
          response.statusCode = 500
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(JSON.stringify({ error: 'The Firebase API request failed.' }))
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), firebaseApiDevPlugin()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
})
