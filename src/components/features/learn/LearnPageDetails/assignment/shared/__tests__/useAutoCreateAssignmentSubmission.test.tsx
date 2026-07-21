// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  shouldAutoCreateSubmission,
  useAutoCreateAssignmentSubmission,
} from '../useAutoCreateAssignmentSubmission'
import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'

const hoisted = vi.hoisted(() => ({
  createAssignmentSubmission: vi.fn(),
  invalidate: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ invalidate: hoisted.invalidate }),
}))
vi.mock('@/lib/api/learn/assignmentDetailActionsApi', () => ({
  createAssignmentSubmission: hoisted.createAssignmentSubmission,
}))

function buildDetail(
  overrides: Partial<AssignmentDetailPayload> = {},
): AssignmentDetailPayload {
  return {
    id: 79307,
    restriction: null,
    assignmentKind: 'assignment',
    phase: 'during',
    footer: { meta: { submissionId: null } },
    ...overrides,
  } as unknown as AssignmentDetailPayload
}

describe('shouldAutoCreateSubmission', () => {
  it('is true for a non-evaluation, unlocked assignment with no submission', () => {
    expect(shouldAutoCreateSubmission(buildDetail())).toBe(true)
  })

  it('is false when the learner is restricted', () => {
    expect(
      shouldAutoCreateSubmission(
        buildDetail({ restriction: { kind: 'ban' } } as never),
      ),
    ).toBe(false)
  })

  it('is false for evaluations (pledge gates creation)', () => {
    expect(
      shouldAutoCreateSubmission(buildDetail({ assignmentKind: 'evaluation' })),
    ).toBe(false)
  })

  it('is false before the schedule window opens', () => {
    expect(shouldAutoCreateSubmission(buildDetail({ phase: 'before' }))).toBe(
      false,
    )
  })

  it('is false when a submission already exists', () => {
    expect(
      shouldAutoCreateSubmission(
        buildDetail({ footer: { meta: { submissionId: 5 } } } as never),
      ),
    ).toBe(false)
  })
})

describe('useAutoCreateAssignmentSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.createAssignmentSubmission.mockResolvedValue({ id: 1 })
    hoisted.invalidate.mockResolvedValue(undefined)
  })

  it('auto-creates the submission then refreshes when eligible', async () => {
    renderHook(() => useAutoCreateAssignmentSubmission(buildDetail()))

    await waitFor(() => {
      expect(hoisted.createAssignmentSubmission).toHaveBeenCalledWith(79307)
      expect(hoisted.invalidate).toHaveBeenCalledTimes(1)
    })
  })

  it('does not create a submission when not eligible', async () => {
    renderHook(() =>
      useAutoCreateAssignmentSubmission(buildDetail({ phase: 'before' })),
    )

    await Promise.resolve()
    expect(hoisted.createAssignmentSubmission).not.toHaveBeenCalled()
  })

  it('only attempts once even across re-renders', async () => {
    const { rerender } = renderHook(
      (detail: AssignmentDetailPayload) =>
        useAutoCreateAssignmentSubmission(detail),
      { initialProps: buildDetail() },
    )

    await waitFor(() =>
      expect(hoisted.createAssignmentSubmission).toHaveBeenCalledTimes(1),
    )

    rerender(buildDetail())
    await Promise.resolve()
    expect(hoisted.createAssignmentSubmission).toHaveBeenCalledTimes(1)
  })

  it('swallows creation failures (learner can still start manually)', async () => {
    hoisted.createAssignmentSubmission.mockRejectedValueOnce(
      new Error('SUBMISSION_ALREADY_EXISTS'),
    )

    renderHook(() => useAutoCreateAssignmentSubmission(buildDetail()))

    await waitFor(() =>
      expect(hoisted.createAssignmentSubmission).toHaveBeenCalledTimes(1),
    )
    expect(hoisted.invalidate).not.toHaveBeenCalled()
  })
})
