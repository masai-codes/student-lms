import { describe, expect, it } from 'vitest'

import {
  extractPathParams,
  parseApiRouteSource,
  tagFromApiPath,
  toOpenApiPath,
} from '@/server/api/docs/scanApiRoutes'

describe('toOpenApiPath', () => {
  it('converts TanStack $params to OpenAPI {params}', () => {
    expect(toOpenApiPath('/api/learn/lectures/$lectureId')).toBe(
      '/api/learn/lectures/{lectureId}',
    )
    expect(
      toOpenApiPath('/api/learn/assignments/$assignmentId/problems/$problemId'),
    ).toBe('/api/learn/assignments/{assignmentId}/problems/{problemId}')
  })
})

describe('tagFromApiPath / extractPathParams', () => {
  it('tags by the first segment after /api', () => {
    expect(tagFromApiPath('/api/learn/page')).toBe('learn')
    expect(tagFromApiPath('/api/me')).toBe('me')
  })

  it('lists path parameter names', () => {
    expect(extractPathParams('/api/learn/lectures/{lectureId}')).toEqual([
      'lectureId',
    ])
  })
})

describe('parseApiRouteSource', () => {
  it('extracts path, methods, and handler params', async () => {
    const source = `
import { createFileRoute } from '@tanstack/react-router'
import { handleGet, handlePost } from '@/server/api/foo/handlers/foo.handler'
export const Route = createFileRoute('/api/user-auth/masai-live-login')({
  server: {
    handlers: {
      GET: ({ request }) => handleGet(request),
      POST: ({ request }) => handlePost(request),
    },
  },
})
`
    const parsed = await parseApiRouteSource(source, 'src/routes/api/x.ts', {
      loadBundle: (symbol) => {
        if (symbol === 'handleGet') {
          return Promise.resolve(
            `const redirect = new URL(request.url).searchParams.get('redirect')`,
          )
        }
        return Promise.resolve(`
          const bodySchema = z.object({ redirect: z.string() })
          await request.json()
        `)
      },
    })

    expect(parsed).toMatchObject({
      path: '/api/user-auth/masai-live-login',
      methods: ['get', 'post'],
      sourceFile: 'src/routes/api/x.ts',
    })
    expect(parsed?.methodDetails.get?.queryParams.map((p) => p.name)).toEqual([
      'redirect',
    ])
    expect(
      parsed?.methodDetails.post?.requestBody?.schema.properties,
    ).toMatchObject({
      redirect: { type: 'string' },
    })
  })

  it('converts $params and skips docs routes', async () => {
    const withParam = `
export const Route = createFileRoute('/api/learn/lectures/$lectureId')({
  server: { handlers: { GET: ({ params }) => go(params.lectureId) } },
})
`
    expect((await parseApiRouteSource(withParam, 'f.ts'))?.path).toBe(
      '/api/learn/lectures/{lectureId}',
    )

    const docs = `
export const Route = createFileRoute('/api/docs/')({
  server: { handlers: { GET: () => ui() } },
})
`
    expect(await parseApiRouteSource(docs, 'docs.ts')).toBeNull()

    const openapi = `
export const Route = createFileRoute('/api/docs/openapi.json')({
  server: { handlers: { GET: () => json() } },
})
`
    expect(await parseApiRouteSource(openapi, 'openapi.ts')).toBeNull()
  })

  it('returns null when createFileRoute or handlers are missing', async () => {
    expect(await parseApiRouteSource('export const x = 1', 'f.ts')).toBeNull()
    expect(
      await parseApiRouteSource(
        `export const Route = createFileRoute('/api/me')({})`,
        'f.ts',
      ),
    ).toBeNull()
  })
})

describe('scanApiRoutes (real tree)', () => {
  it('inventories live route files with query/body when present', async () => {
    const { scanApiRoutes } = await import('@/server/api/docs/scanApiRoutes')
    const routes = await scanApiRoutes()
    const paths = routes.map((r) => r.path)

    expect(paths).toContain('/api/me')
    expect(paths).toContain('/api/user-auth/masai-live-login')
    expect(paths.some((p) => p.startsWith('/api/docs'))).toBe(false)

    const live = routes.find(
      (r) => r.path === '/api/user-auth/masai-live-login',
    )
    expect(live?.methodDetails.get?.queryParams.map((p) => p.name)).toContain(
      'redirect',
    )
    expect(
      live?.methodDetails.post?.requestBody?.schema.properties,
    ).toHaveProperty('redirect')

    const discussions = routes.find(
      (r) => r.path === '/api/masaiverse-v2/discussions',
    )
    expect(
      discussions?.methodDetails.get?.queryParams.map((p) => p.name),
    ).toEqual(expect.arrayContaining(['offset', 'limit', 'q', 'clubId']))

    const lectures = routes.find(
      (r) => r.path === '/api/learn/lectures/{lectureId}',
    )
    expect(lectures?.methods).toContain('get')
  })
})
