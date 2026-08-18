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
vi.mock('@/db/schema', () => ({
  lectures: {
    id: {},
    zoomDetails: {},
    hostId: {},
    settings: {},
    batchId: {},
    title: {},
  },
  users: { id: {}, email: {} },
  batches: { id: {}, duration: {} },
}))

const STUDENT = { id: 7, role: 'student', name: 'Asha', email: 'a@x.com' }
const ADMIN = { id: 42, role: 'admin', name: 'IA', email: 'admin@x.com' }

/** A lecture row as selected by the main fetch. */
function lectureRow(over: Record<string, unknown> = {}) {
  return [
    {
      zoomDetails: {},
      hostId: null,
      settings: null,
      batchId: null,
      title: 'DSA 101',
      ...over,
    },
  ]
}

function payloadOf(url: string): Record<string, unknown> {
  const token = new URL(url).searchParams.get('token') ?? ''
  return jwt.decode(token) as Record<string, unknown>
}

async function load() {
  const mod = await import('../zoomRedirectionToken')
  return mod.generateZoomRedirectionUrl
}

describe('generateZoomRedirectionUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.selectQueue = []
    process.env.ZOOM_REDIRECTION_JWT_SECRET = 'test-secret'
  })

  afterEach(() => {
    delete process.env.ZOOM_REDIRECTION_JWT_SECRET
  })

  it('signs a student token and points at the Masai platform', async () => {
    hoisted.selectQueue = [[{ zoomDetails: null }], lectureRow()]
    const generate = await load()

    const result = await generate({ lectureId: '572', user: STUDENT })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.url.startsWith('https://zoom.masaischool.com/?token=')).toBe(
      true,
    )
    expect(payloadOf(result.url)).toMatchObject({
      lectureId: '572',
      role: 'student',
      role_zoom: 'student',
      userId: '7',
      username: 'Asha',
      email: 'a@x.com',
    })
    expect(payloadOf(result.url)).not.toHaveProperty('isInstructor')
    expect(payloadOf(result.url)).toHaveProperty('exp')
  })

  it('resolves the effective lecture id via groupLectureIdentifier', async () => {
    hoisted.selectQueue = [
      [{ zoomDetails: { groupLectureIdentifier: 'grp-2' } }],
      [{ id: 10 }, { id: 20 }],
      lectureRow(),
    ]
    const generate = await load()

    const result = await generate({ lectureId: '10', user: STUDENT })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(payloadOf(result.url).lectureId).toBe('20')
  })

  it('builds an iHub url for iHub batches', async () => {
    hoisted.selectQueue = [
      [{ zoomDetails: null }],
      lectureRow({ batchId: 5 }),
      [{ duration: 'ihub' }],
    ]
    const generate = await load()

    const result = await generate({ lectureId: '572', user: STUDENT })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(
      result.url.startsWith('https://zoom.ihubiitrcourses.org/?token='),
    ).toBe(true)
  })

  it('routes ivs lectures on non-iHub batches to the Masai IVS platform', async () => {
    hoisted.selectQueue = [
      [{ zoomDetails: null }],
      lectureRow({ zoomDetails: { redirectionType: 'ivs' }, batchId: 5 }),
      [{ duration: 'full-time' }],
    ]
    const generate = await load()

    const result = await generate({ lectureId: '572', user: STUDENT })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(
      result.url.startsWith('https://classroom.masaischool.com/?token='),
    ).toBe(true)
  })

  it('routes ivs lectures on iHub batches to the iHub IVS platform', async () => {
    hoisted.selectQueue = [
      [{ zoomDetails: null }],
      lectureRow({ zoomDetails: { redirectionType: 'ivs' }, batchId: 5 }),
      [{ duration: 'ihub' }],
    ]
    const generate = await load()

    const result = await generate({ lectureId: '572', user: STUDENT })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(
      result.url.startsWith('https://classroom.ihubiitrcourses.org/?token='),
    ).toBe(true)
  })

  it('falls back to the Masai IVS platform when the lecture has no batch', async () => {
    hoisted.selectQueue = [
      [{ zoomDetails: null }],
      lectureRow({ zoomDetails: { redirectionType: 'ivs' }, batchId: null }),
    ]
    const generate = await load()

    const result = await generate({ lectureId: '572', user: STUDENT })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(
      result.url.startsWith('https://classroom.masaischool.com/?token='),
    ).toBe(true)
  })

  it('signs the ivs payload shape: lectureTitle, no email/role_zoom, no iat/exp', async () => {
    hoisted.selectQueue = [
      [{ zoomDetails: null }],
      lectureRow({ zoomDetails: { redirectionType: 'ivs' } }),
    ]
    const generate = await load()

    const result = await generate({ lectureId: '572', user: STUDENT })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(payloadOf(result.url)).toEqual({
      lectureId: '572',
      lectureTitle: 'DSA 101',
      userId: '7',
      username: 'Asha',
      role: 'student',
      isInstructor: false,
    })
  })

  it('gives the ivs primary host an admin token with isInstructor', async () => {
    hoisted.selectQueue = [
      [{ zoomDetails: null }],
      lectureRow({ zoomDetails: { redirectionType: 'ivs' }, hostId: 42 }),
    ]
    const generate = await load()

    const result = await generate({ lectureId: '572', user: ADMIN })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(payloadOf(result.url)).toMatchObject({
      role: 'admin',
      // not prefixed with "Admin " — hosts join under their own name
      username: 'IA',
      isInstructor: true,
    })
  })

  it('gives an ivs secondary host isInstructor false', async () => {
    hoisted.selectQueue = [
      [{ zoomDetails: null }],
      lectureRow({
        zoomDetails: { redirectionType: 'ivs' },
        hostId: 99,
        settings: { secondary_host_ids: [42] },
      }),
    ]
    const generate = await load()

    const result = await generate({ lectureId: '572', user: ADMIN })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(payloadOf(result.url)).toMatchObject({
      role: 'admin',
      username: 'IA',
      isInstructor: false,
    })
  })

  it('rejects an ivs admin who is not a host for the lecture', async () => {
    hoisted.selectQueue = [
      [{ zoomDetails: null }],
      lectureRow({ zoomDetails: { redirectionType: 'ivs' }, hostId: 99 }),
    ]
    const generate = await load()

    const result = await generate({ lectureId: '572', user: ADMIN })

    expect(result).toEqual({
      ok: false,
      status: 403,
      message: 'Admin is not a host for this lecture',
    })
  })

  it('swaps the zoom primary host onto the licensed email', async () => {
    hoisted.selectQueue = [
      [{ zoomDetails: null }],
      lectureRow({
        zoomDetails: {
          hostAdminDashboardUserId: 42,
          license_email_id: 'lic@x.com',
        },
      }),
      [{ email: 'Admin@x.com' }],
    ]
    const generate = await load()

    const result = await generate({ lectureId: '572', user: ADMIN })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(payloadOf(result.url)).toMatchObject({
      role: 'admin',
      role_zoom: 'admin',
      username: 'IA',
      email: 'lic@x.com',
    })
  })

  it('lets a non-host zoom admin join as a prefixed participant', async () => {
    hoisted.selectQueue = [
      [{ zoomDetails: null }],
      lectureRow({
        zoomDetails: {
          hostAdminDashboardUserId: 99,
          license_email_id: 'lic@x.com',
        },
      }),
      [{ email: 'someone-else@x.com' }],
    ]
    const generate = await load()

    const result = await generate({ lectureId: '572', user: ADMIN })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(payloadOf(result.url)).toMatchObject({
      role: 'admin',
      role_zoom: 'student',
      username: 'Admin IA',
      email: 'admin@x.com',
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

  it('returns 401 when a student has no email', async () => {
    hoisted.selectQueue = [[{ zoomDetails: null }], lectureRow()]
    const generate = await load()

    const result = await generate({
      lectureId: '572',
      user: { ...STUDENT, email: '' },
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
