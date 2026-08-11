import { afterEach, describe, expect, it, vi } from 'vitest'

import { handleGetDocsUi } from '@/server/api/docs/handlers/getDocsUi.handler'
import { handleGetOpenApiJson } from '@/server/api/docs/handlers/getOpenApiJson.handler'

vi.mock('@/server/api/docs/buildOpenApiDocument', () => ({
  buildOpenApiDocument: vi.fn(() =>
    Promise.resolve({
      openapi: '3.0.3',
      info: { title: 'Student LMS API', version: '1.0.0', description: 'test' },
      servers: [{ url: '/', description: 'Current origin' }],
      tags: [{ name: 'me' }],
      paths: {
        '/api/me': { get: { summary: 'GET /api/me' } },
        '/api/user-auth/masai-live-login': {
          get: { summary: 'GET login' },
          post: { summary: 'POST login' },
        },
      },
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'session',
            description: 'test',
          },
        },
      },
    }),
  ),
}))

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('handleGetDocsUi', () => {
  it('returns 404 in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(handleGetDocsUi().status).toBe(404)
  })

  it('returns Swagger UI HTML outside production', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const res = handleGetDocsUi()
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/html')
    const html = await res.text()
    expect(html).toContain('swagger-ui')
    expect(html).toContain('/api/docs/openapi.json')
  })
})

describe('handleGetOpenApiJson', () => {
  it('returns 404 in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect((await handleGetOpenApiJson()).status).toBe(404)
  })

  it('returns OpenAPI JSON outside production', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const res = await handleGetOpenApiJson()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.paths['/api/me']).toBeTruthy()
    expect(body.paths['/api/user-auth/masai-live-login']).toBeTruthy()
  })
})
