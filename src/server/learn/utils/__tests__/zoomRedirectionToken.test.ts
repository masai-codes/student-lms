import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import jwt from 'jsonwebtoken'

const hoisted = vi.hoisted(() => ({
  selectQueue: [] as Array<Array<Record<string, unknown>>>,
}))

vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(hoisted.selectQueue.shift() ?? []),
          orderBy: () => Promise.resolve(hoisted.selectQueue.shift() ?? []),
        }),
      }),
    }),
  },
}))
vi.mock('@/db/schema', () => ({ lectures: { id: {}, zoomDetails: {} } }))

const STUDENT = { id: 7, role: 'student', name: 'Asha', email: 'a@x.com' }

async function load() {
  const mod = await import('../zoomRedirectionToken')
  return mod.generateZoomRedirectionToken
}

describe('generateZoomRedirectionToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.selectQueue = []
    process.env.ZOOM_REDIRECTION_JWT_SECRET = 'test-secret'
  })

  afterEach(() => {
    delete process.env.ZOOM_REDIRECTION_JWT_SECRET
  })

  it('signs a token for a normal user', async () => {
    hoisted.selectQueue = [[{ zoomDetails: null }]]
    const generate = await load()

    const result = await generate({ lectureId: '572', user: STUDENT })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    const payload = jwt.decode(result.token) as Record<string, unknown>
    expect(payload).toMatchObject({
      lectureId: '572',
      role: 'student',
      userId: '7',
      username: 'Asha',
      email: 'a@x.com',
    })
  })

  it('resolves the effective lecture id via groupLectureIdentifier', async () => {
    hoisted.selectQueue = [
      [{ zoomDetails: { groupLectureIdentifier: 'grp-2' } }],
      [{ id: 10 }, { id: 20 }],
    ]
    const generate = await load()

    const result = await generate({ lectureId: '10', user: STUDENT })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    const payload = jwt.decode(result.token) as Record<string, unknown>
    expect(payload.lectureId).toBe('20')
  })

  it('maps an admin dashboard email to the licensed host email', async () => {
    hoisted.selectQueue = [
      [{ zoomDetails: {} }],
      [
        {
          zoomDetails: {
            hostAdminDashboardEmailId: 'admin@x.com',
            license_email_id: 'lic@x.com',
          },
        },
      ],
    ]
    const generate = await load()

    const result = await generate({
      lectureId: '572',
      user: { id: 1, role: 'admin', name: 'IA', email: 'admin@x.com' },
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    const payload = jwt.decode(result.token) as Record<string, unknown>
    expect(payload.email).toBe('lic@x.com')
  })

  it('rejects an admin whose email is not authorized', async () => {
    hoisted.selectQueue = [[{ zoomDetails: {} }], [{ zoomDetails: {} }]]
    const generate = await load()

    const result = await generate({
      lectureId: '572',
      user: { id: 1, role: 'admin', name: 'IA', email: 'nobody@x.com' },
    })

    expect(result).toEqual({
      ok: false,
      status: 403,
      message: 'Admin email is not authorized for this lecture',
    })
  })

  it('returns 400 for a blank lecture id', async () => {
    const generate = await load()
    const result = await generate({ lectureId: '   ', user: STUDENT })
    expect(result).toMatchObject({ ok: false, status: 400 })
  })

  it('returns 401 when required user fields are missing', async () => {
    hoisted.selectQueue = [[{ zoomDetails: null }]]
    const generate = await load()

    const result = await generate({
      lectureId: '572',
      user: { id: 7, role: 'student', name: '', email: 'a@x.com' },
    })

    expect(result).toMatchObject({ ok: false, status: 401 })
  })

  it('returns 500 when the signing secret is not configured', async () => {
    delete process.env.ZOOM_REDIRECTION_JWT_SECRET
    hoisted.selectQueue = [[{ zoomDetails: null }]]
    const generate = await load()

    const result = await generate({ lectureId: '572', user: STUDENT })

    expect(result).toMatchObject({ ok: false, status: 500 })
  })
})
