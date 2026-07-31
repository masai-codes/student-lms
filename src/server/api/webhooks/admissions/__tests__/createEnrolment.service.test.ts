import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createEnrolmentFromAdmissions } from '@/server/api/webhooks/admissions/createEnrolment.service'

const FAKE_TX = { tx: true }

const assertActiveBatchExists = vi.hoisted(() => vi.fn())
const resolveValidSections = vi.hoisted(() => vi.fn())
const resolveEnrolmentUser = vi.hoisted(() => vi.fn())
const applyPortalNewLmsDefaults = vi.hoisted(() => vi.fn())
const reviveOrCreateBatchUser = vi.hoisted(() => vi.fn())
const reviveOrCreateSectionUsers = vi.hoisted(() => vi.fn())
const upsertAdmissionData = vi.hoisted(() => vi.fn())
const invalidatePortalEnrollmentCache = vi.hoisted(() => vi.fn())

vi.mock('@/db', () => ({
  db: { transaction: (cb: (tx: unknown) => unknown) => cb(FAKE_TX) },
}))
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))
vi.mock(
  '@/server/api/webhooks/admissions/steps/assertActiveBatchExists',
  () => ({
    assertActiveBatchExists,
  }),
)
vi.mock('@/server/api/webhooks/admissions/steps/resolveValidSections', () => ({
  resolveValidSections,
}))
vi.mock('@/server/api/webhooks/admissions/steps/resolveEnrolmentUser', () => ({
  resolveEnrolmentUser,
}))
vi.mock(
  '@/server/api/webhooks/admissions/steps/applyPortalNewLmsDefaults',
  () => ({ applyPortalNewLmsDefaults }),
)
vi.mock(
  '@/server/api/webhooks/admissions/steps/reviveOrCreateBatchUser',
  () => ({ reviveOrCreateBatchUser }),
)
vi.mock(
  '@/server/api/webhooks/admissions/steps/reviveOrCreateSectionUsers',
  () => ({ reviveOrCreateSectionUsers }),
)
vi.mock('@/server/api/webhooks/admissions/steps/upsertAdmissionData', () => ({
  upsertAdmissionData,
}))
vi.mock('@/server/batches/portalEnrollmentCache', () => ({
  invalidatePortalEnrollmentCache,
}))

function input(overrides: Record<string, unknown> = {}) {
  return {
    email: 'student@example.com',
    batch_id: 10,
    section_ids: [201, 202],
    enrolment_id: 123,
    username: 'student',
    password: 'secret',
    manager_id: 5,
    isiHub: false,
    new_user_journey: false,
    ...overrides,
  } as never
}

beforeEach(() => {
  vi.clearAllMocks()
  resolveValidSections.mockResolvedValue({
    validSectionIds: [201],
    invalidSectionIds: [202],
  })
  resolveEnrolmentUser.mockResolvedValue(7)
  reviveOrCreateBatchUser.mockResolvedValue(55)
})

describe('createEnrolmentFromAdmissions', () => {
  it('enrols the student into the valid sections and reports the skipped ones', async () => {
    const result = await createEnrolmentFromAdmissions(input())

    expect(assertActiveBatchExists).toHaveBeenCalledWith(10)
    expect(reviveOrCreateSectionUsers).toHaveBeenCalledWith(FAKE_TX, {
      userId: 7,
      sectionIds: [201],
      managerId: 5,
    })
    expect(upsertAdmissionData).not.toHaveBeenCalled()
    expect(result).toEqual({
      userId: 7,
      batchUserId: 55,
      validSectionIds: [201],
      invalidSectionIds: [202],
    })
  })

  it('records admission data on the new-user journey', async () => {
    await createEnrolmentFromAdmissions(input({ new_user_journey: true }))
    expect(upsertAdmissionData).toHaveBeenCalledWith(
      FAKE_TX,
      expect.objectContaining({ userId: 7 }),
    )
  })

  it('never persists the plaintext password in the audit payload', async () => {
    await createEnrolmentFromAdmissions(input())
    const { payload } = reviveOrCreateBatchUser.mock.calls[0][1]
    expect(payload).not.toHaveProperty('password')
  })

  it('defaults the new-LMS-only meta flags for an iitj enrolment', async () => {
    await createEnrolmentFromAdmissions(input({ isiitj: true }))
    expect(applyPortalNewLmsDefaults).toHaveBeenCalledWith(FAKE_TX, {
      userId: 7,
      client: 'iitj',
    })
  })

  it('passes the resolved client through for a masai enrolment', async () => {
    await createEnrolmentFromAdmissions(input())
    expect(applyPortalNewLmsDefaults).toHaveBeenCalledWith(FAKE_TX, {
      userId: 7,
      client: 'masai',
    })
  })

  it('clears the cached enrolment sets for the student', async () => {
    await createEnrolmentFromAdmissions(input())
    expect(invalidatePortalEnrollmentCache).toHaveBeenCalledWith(7)
  })

  it('rejects (and skips invalidation) when no requested section is valid', async () => {
    resolveValidSections.mockResolvedValue({
      validSectionIds: [],
      invalidSectionIds: [201, 202],
    })

    await expect(createEnrolmentFromAdmissions(input())).rejects.toMatchObject({
      status: 422,
      code: 'NO_VALID_SECTIONS',
    })
    expect(resolveEnrolmentUser).not.toHaveBeenCalled()
    expect(invalidatePortalEnrollmentCache).not.toHaveBeenCalled()
  })
})
