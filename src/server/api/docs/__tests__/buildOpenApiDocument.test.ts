import { describe, expect, it } from 'vitest'

import { buildOpenApiDocumentFromRoutes } from '@/server/api/docs/buildOpenApiDocument'
import type { ScannedApiRoute } from '@/server/api/docs/scanApiRoutes'

describe('buildOpenApiDocumentFromRoutes', () => {
  it('emits path params, query params, and request bodies', () => {
    const routes: ScannedApiRoute[] = [
      {
        path: '/api/me',
        methods: ['get'],
        methodDetails: { get: { queryParams: [], requestBody: null } },
        sourceFile: 'src/routes/api/me.ts',
      },
      {
        path: '/api/user-auth/masai-live-login',
        methods: ['get', 'post'],
        methodDetails: {
          get: {
            queryParams: [{ name: 'redirect', schema: { type: 'string' } }],
            requestBody: null,
          },
          post: {
            queryParams: [],
            requestBody: {
              required: true,
              schema: {
                type: 'object',
                properties: { redirect: { type: 'string' } },
              },
            },
          },
        },
        sourceFile: 'src/routes/api/user-auth/masai-live-login.ts',
      },
      {
        path: '/api/learn/lectures/{lectureId}',
        methods: ['get'],
        methodDetails: { get: { queryParams: [], requestBody: null } },
        sourceFile: 'src/routes/api/learn/lectures/$lectureId.ts',
      },
    ]

    const doc = buildOpenApiDocumentFromRoutes(routes)
    expect(doc.paths['/api/me']).toHaveProperty('get')
    expect(doc.paths['/api/user-auth/masai-live-login']?.get).toMatchObject({
      parameters: [expect.objectContaining({ name: 'redirect', in: 'query' })],
    })
    expect(doc.paths['/api/user-auth/masai-live-login']?.post).toMatchObject({
      requestBody: {
        content: {
          'application/json': {
            schema: {
              properties: { redirect: { type: 'string' } },
            },
          },
        },
      },
    })
    expect(doc.paths['/api/learn/lectures/{lectureId}']?.get).toMatchObject({
      tags: ['learn'],
      parameters: [
        expect.objectContaining({
          name: 'lectureId',
          in: 'path',
          required: true,
        }),
      ],
    })
  })

  it('never attaches requestBody to GET even if inventory is polluted', () => {
    const routes: ScannedApiRoute[] = [
      {
        path: '/api/support/tickets',
        methods: ['get'],
        methodDetails: {
          get: {
            queryParams: [{ name: 'tab', schema: { type: 'string' } }],
            requestBody: {
              required: true,
              schema: {
                type: 'object',
                properties: { message: { type: 'string' } },
              },
            },
          },
        },
        sourceFile: 'src/routes/api/support/tickets.ts',
      },
    ]

    const doc = buildOpenApiDocumentFromRoutes(routes)
    expect(doc.paths['/api/support/tickets']?.get).toMatchObject({
      parameters: [expect.objectContaining({ name: 'tab', in: 'query' })],
    })
    expect(doc.paths['/api/support/tickets']?.get).not.toHaveProperty(
      'requestBody',
    )
  })
})
