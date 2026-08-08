import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  callbackBaseUrl,
  createAssessPlatformUrl,
} from '../createAssessPlatformUrl'
import { isApiError } from '@/server/api/http/apiError'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  dbUpdate: vi.fn(),
  acquireLock: vi.fn(),
  releaseLock: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect, update: hoisted.dbUpdate },
}))

vi.mock('@/server/redis/lock', () => ({
  acquireLock: hoisted.acquireLock,
  releaseLock: hoisted.releaseLock,
}))

function queueSelect(rows: Array<unknown>) {
  hoisted.dbSelect.mockReturnValueOnce({
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  })
}

async function expectApiError(promise: Promise<unknown>, code: string) {
  await promise.then(
    () => {
      throw new Error('expected rejection')
    },
    (error: unknown) => {
      expect(isApiError(error)).toBe(true)
      expect((error as { code: string }).code).toBe(code)
    },
  )
}

const ENV_KEYS = [
  'ASSESS_PLATFORM_URL',
  'ASSESS_PLATFORM_AUTH_TOKEN',
  'ASSESS_PLATFORM_SECRET_KEY',
  'ASSESS_PLATFORM_CALLBACK_TOKEN',
  'EXPERIENCE_API_BASE_URL',
] as const

describe('createAssessPlatformUrl', () => {
  const saved: Record<string, string | undefined> = {}

  beforeEach(() => {
    vi.clearAllMocks()
    for (const key of ENV_KEYS) saved[key] = process.env[key]
  })

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key]
      else process.env[key] = saved[key]
    }
    vi.unstubAllGlobals()
  })

  it('throws when the callback token is missing', async () => {
    delete process.env.ASSESS_PLATFORM_CALLBACK_TOKEN
    await expectApiError(
      createAssessPlatformUrl({ assignmentId: 1, submissionId: 2, userId: 7 }),
      'ASSESS_PLATFORM_CALLBACK_TOKEN_MISSING',
    )
    expect(hoisted.dbSelect).not.toHaveBeenCalled()
  })

  it('throws when core platform env is missing', async () => {
    process.env.ASSESS_PLATFORM_CALLBACK_TOKEN = 'cb'
    delete process.env.ASSESS_PLATFORM_URL
    delete process.env.ASSESS_PLATFORM_AUTH_TOKEN
    delete process.env.ASSESS_PLATFORM_SECRET_KEY
    await expectApiError(
      createAssessPlatformUrl({ assignmentId: 1, submissionId: 2, userId: 7 }),
      'ASSESS_PLATFORM_NOT_CONFIGURED',
    )
  })

  it('returns the existing link without calling the platform', async () => {
    process.env.ASSESS_PLATFORM_URL = 'http://assess.test'
    process.env.ASSESS_PLATFORM_AUTH_TOKEN = 'auth'
    process.env.ASSESS_PLATFORM_SECRET_KEY = 'secret'
    process.env.ASSESS_PLATFORM_CALLBACK_TOKEN = 'cb'
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    // loadOwnedSubmission -> row already has a stored link
    queueSelect([
      {
        id: 2,
        data: { assess_platform_link: 'http://assess.test/?token=abc' },
      },
    ])

    await expect(
      createAssessPlatformUrl({ assignmentId: 1, submissionId: 2, userId: 7 }),
    ).resolves.toEqual({ url: 'http://assess.test/?token=abc' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  // Regression: experience-api registers /lms-callback & friends as exact paths
  // at its root. A "/graphql" suffix here made every Assess webhook land on the
  // Apollo catch-all instead, which rejected it as INVALID_COOKIE (HTTP 500) —
  // so scores and completions silently never came back.
  it('builds the callback base from the bare experience-api origin', () => {
    process.env.EXPERIENCE_API_BASE_URL = 'https://experience-api.test/'
    expect(callbackBaseUrl()).toBe('https://experience-api.test')
    expect(`${callbackBaseUrl()}/lms-callback`).toBe(
      'https://experience-api.test/lms-callback',
    )
  })

  it('throws when the experience-api base url is missing', () => {
    delete process.env.EXPERIENCE_API_BASE_URL
    expect(() => callbackBaseUrl()).toThrow()
  })

  // Regression: assignment 81793 ("Module - 3 Evaluation", case3 +
  // attemptInWindow, 90 min inside a 12:00-20:00 IST window) sent Assess the
  // whole remaining window, so students got ~8 hours. The payload must carry
  // the fixed duration plus the deadline that stops a late starter.
  it('sends the windowed duration and mustEndOnOrBefore for attemptInWindow assignments', async () => {
    process.env.ASSESS_PLATFORM_URL = 'http://assess.test'
    process.env.ASSESS_PLATFORM_AUTH_TOKEN = 'auth'
    process.env.ASSESS_PLATFORM_SECRET_KEY = 'secret'
    process.env.ASSESS_PLATFORM_CALLBACK_TOKEN = 'cb'
    process.env.EXPERIENCE_API_BASE_URL = 'https://experience-api.test'

    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-08T12:14:10+05:30'))

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: 'http://assess.test/?token=xyz' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    hoisted.acquireLock.mockResolvedValue(true)
    hoisted.releaseLock.mockResolvedValue(undefined)
    hoisted.dbUpdate.mockReturnValue({
      set: () => ({ where: () => Promise.resolve([{ affectedRows: 1 }]) }),
    })

    queueSelect([{ id: 2, data: null }]) // loadOwnedSubmission
    queueSelect([
      {
        id: 1,
        concludes: '2026-08-08 20:00:00',
        settings: {
          case: 'case3',
          duration: 90,
          attemptInWindow: true,
          sectionDetailTime: '5400',
          assess_platform_id: 'tpl',
          assess_platform_client_id: 'client',
        },
        batchId: 270,
      },
    ])
    queueSelect([{ duration: 'full-time' }]) // batches
    queueSelect([{ email: 'a@b.test', username: 'u' }]) // users
    queueSelect([{ id: 2, data: null }]) // re-check under the lock

    await expect(
      createAssessPlatformUrl({ assignmentId: 1, submissionId: 2, userId: 7 }),
    ).resolves.toEqual({ url: 'http://assess.test/?token=xyz' })

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body.overrideSectionTime).toBe(5400)
    expect(body.mustEndOnOrBefore).toBe('2026-08-08T14:30:00.000Z')

    vi.useRealTimers()
  })

  it('404s when the submission is not owned/found', async () => {
    process.env.ASSESS_PLATFORM_URL = 'http://assess.test'
    process.env.ASSESS_PLATFORM_AUTH_TOKEN = 'auth'
    process.env.ASSESS_PLATFORM_SECRET_KEY = 'secret'
    process.env.ASSESS_PLATFORM_CALLBACK_TOKEN = 'cb'

    queueSelect([]) // no submission

    await expectApiError(
      createAssessPlatformUrl({ assignmentId: 1, submissionId: 2, userId: 7 }),
      'SUBMISSION_NOT_FOUND',
    )
  })
})
