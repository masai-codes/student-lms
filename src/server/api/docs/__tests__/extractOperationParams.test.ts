import { describe, expect, it } from 'vitest'

import {
  extractQueryParams,
  extractRequestBody,
} from '@/server/api/docs/extractOperationParams'

describe('extractQueryParams', () => {
  it('finds searchParams.get and params.get keys', () => {
    const source = `
      const params = new URL(request.url).searchParams
      const offset = params.get('offset')
      const q = searchParams.get('q')
      const clubId = params.get("clubId")
    `
    expect(extractQueryParams(source).map((p) => p.name)).toEqual([
      'clubId',
      'offset',
      'q',
    ])
  })
})

describe('extractRequestBody', () => {
  it('mines Zod object fields', () => {
    const source = `
      const bodySchema = z.object({
        kind: z.enum(['lecture', 'assignment']),
        entityId: z.number(),
        title: z.string(),
        optionalNote: z.string().optional(),
      })
      await request.json()
    `
    const body = extractRequestBody(source)
    expect(body?.schema.properties).toMatchObject({
      kind: { type: 'string', enum: ['lecture', 'assignment'] },
      entityId: { type: 'number' },
      title: { type: 'string' },
      optionalNote: { type: 'string' },
    })
  })

  it('mines type assertions and soft body.field access', () => {
    const source = `
      const body = (await request.json()) as { completed?: boolean; token?: string }
      if ('redirect' in body) return body.redirect
    `
    const body = extractRequestBody(source)
    expect(body?.schema.properties).toMatchObject({
      completed: { type: 'boolean' },
      token: { type: 'string' },
      redirect: { type: 'string' },
    })
  })

  it('falls back to an open object when json is used without fields', () => {
    const source = `const raw = await request.json().catch(() => ({}))`
    const body = extractRequestBody(source)
    expect(body?.schema.additionalProperties).toBe(true)
  })

  it('returns null when there is no JSON body', () => {
    expect(extractRequestBody(`return jsonOk({ ok: true })`)).toBeNull()
  })
})
