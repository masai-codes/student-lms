import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  getCurrentUserId: vi.fn(),
  dbSelect: vi.fn(),
  migrateAiTutorFeedbackRatings: vi.fn(),
}))

vi.mock('@/server/auth/getCurrentSessionUserId', () => ({
  getCurrentUserId: hoisted.getCurrentUserId,
}))

vi.mock('@/db', () => ({
  db: { select: hoisted.dbSelect },
}))

vi.mock('@/db/schema', () => ({
  users: { id: 'users.id', role: 'users.role' },
}))

vi.mock('@/server/api/ai-tutor/migrateAiTutorFeedbackRatings.service', () => ({
  migrateAiTutorFeedbackRatings: hoisted.migrateAiTutorFeedbackRatings,
}))

function postRequest(
  body: unknown,
  cookie: string | null = 'session=abc',
): Request {
  return new Request('http://localhost/api/ai-tutor/chat/feedback/migrate-ratings', {
    method: 'POST',
    headers: {
      ...(cookie ? { cookie } : {}),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

function adminSelectChain(role: string | null) {
  return {
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve(role == null ? [] : [{ role }]),
      }),
    }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('handleMigrateFeedbackRatings', () => {
  it('returns 401 when the session cookie is missing', async () => {
    const { handleMigrateFeedbackRatings } =
      await import('../handlers/migrateFeedbackRatings.handler')
    hoisted.getCurrentUserId.mockResolvedValueOnce(null)

    const res = await handleMigrateFeedbackRatings(postRequest({}, null))

    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin users', async () => {
    const { handleMigrateFeedbackRatings } =
      await import('../handlers/migrateFeedbackRatings.handler')
    hoisted.getCurrentUserId.mockResolvedValueOnce(7)
    hoisted.dbSelect.mockReturnValueOnce(adminSelectChain('student'))

    const res = await handleMigrateFeedbackRatings(postRequest({ dryRun: true }))

    expect(res.status).toBe(422)
    expect(res.headers.get('x-true-status')).toBe('403')
    await expect(res.json()).resolves.toMatchObject({
      code: 'AI_TUTOR_MIGRATION_FORBIDDEN',
    })
  })

  it('runs the migration for admins', async () => {
    const { handleMigrateFeedbackRatings } =
      await import('../handlers/migrateFeedbackRatings.handler')
    hoisted.getCurrentUserId.mockResolvedValueOnce(7)
    hoisted.dbSelect.mockReturnValueOnce(adminSelectChain('admin'))
    hoisted.migrateAiTutorFeedbackRatings.mockResolvedValueOnce({
      dryRun: true,
      scanned: 2,
      updated: 1,
      unchanged: 1,
      skipped: 0,
      changes: [{ id: 1, previousRating: 6, rating: 5 }],
      skippedRows: [],
    })

    const res = await handleMigrateFeedbackRatings(postRequest({ dryRun: true }))

    expect(res.status).toBe(200)
    expect(hoisted.migrateAiTutorFeedbackRatings).toHaveBeenCalledWith({
      dryRun: true,
    })
    await expect(res.json()).resolves.toMatchObject({ scanned: 2, updated: 1 })
  })
})
