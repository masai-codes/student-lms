import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createAssessPlatformUrl } from '../createAssessPlatformUrl'
import { isApiError } from '@/server/api/http/apiError'

const hoisted = vi.hoisted(() => ({ dbSelect: vi.fn() }))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))

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
      { id: 2, data: { assess_platform_link: 'http://assess.test/?token=abc' } },
    ])

    await expect(
      createAssessPlatformUrl({ assignmentId: 1, submissionId: 2, userId: 7 }),
    ).resolves.toEqual({ url: 'http://assess.test/?token=abc' })
    expect(fetchMock).not.toHaveBeenCalled()
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
