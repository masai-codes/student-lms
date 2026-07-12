// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  readTokenCompletionParams,
  useTokenCompletion,
} from '../useTokenCompletion'

const hoisted = vi.hoisted(() => ({
  markSubmissionCompletedWithToken: vi.fn(),
  invalidate: vi.fn(),
  search: {} as Record<string, unknown>,
}))

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ invalidate: hoisted.invalidate }),
  useRouterState: ({
    select,
  }: {
    select: (state: { location: { search: Record<string, unknown> } }) => unknown
  }) => select({ location: { search: hoisted.search } }),
}))
vi.mock('@/lib/api/learn/assignmentDetailActionsApi', () => ({
  markSubmissionCompletedWithToken: hoisted.markSubmissionCompletedWithToken,
}))

describe('readTokenCompletionParams', () => {
  it('returns the token when markAsCompleted is the boolean true', () => {
    expect(
      readTokenCompletionParams({ markAsCompleted: true, sauToken: 'abc' }),
    ).toBe('abc')
  })

  it('returns the token when markAsCompleted is the string "true"', () => {
    expect(
      readTokenCompletionParams({ markAsCompleted: 'true', sauToken: 'abc' }),
    ).toBe('abc')
  })

  it('returns null when the markAsCompleted flag is absent', () => {
    expect(readTokenCompletionParams({ sauToken: 'abc' })).toBeNull()
  })

  it('returns null when the token is missing or blank', () => {
    expect(readTokenCompletionParams({ markAsCompleted: true })).toBeNull()
    expect(
      readTokenCompletionParams({ markAsCompleted: true, sauToken: '  ' }),
    ).toBeNull()
    expect(
      readTokenCompletionParams({ markAsCompleted: true, sauToken: 42 }),
    ).toBeNull()
  })
})

describe('useTokenCompletion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.search = {}
    hoisted.markSubmissionCompletedWithToken.mockResolvedValue({
      markAsCompleted: true,
    })
    hoisted.invalidate.mockResolvedValue(undefined)
  })

  it('completes via token then refreshes when params are present', async () => {
    hoisted.search = { markAsCompleted: 'true', sauToken: 'abc123' }
    renderHook(() => useTokenCompletion(79307))

    await waitFor(() => {
      expect(hoisted.markSubmissionCompletedWithToken).toHaveBeenCalledWith(
        79307,
        'abc123',
      )
      expect(hoisted.invalidate).toHaveBeenCalledTimes(1)
    })
  })

  it('does nothing when the completion params are absent', async () => {
    renderHook(() => useTokenCompletion(79307))

    await Promise.resolve()
    expect(hoisted.markSubmissionCompletedWithToken).not.toHaveBeenCalled()
  })

  it('only attempts once for the same token across re-renders', async () => {
    hoisted.search = { markAsCompleted: 'true', sauToken: 'abc123' }
    const { rerender } = renderHook(() => useTokenCompletion(79307))

    await waitFor(() =>
      expect(hoisted.markSubmissionCompletedWithToken).toHaveBeenCalledTimes(1),
    )

    rerender()
    await Promise.resolve()
    expect(hoisted.markSubmissionCompletedWithToken).toHaveBeenCalledTimes(1)
  })

  it('swallows a failed completion (stale/invalid token)', async () => {
    hoisted.search = { markAsCompleted: 'true', sauToken: 'abc123' }
    hoisted.markSubmissionCompletedWithToken.mockRejectedValueOnce(
      new Error('INVALID_TOKEN'),
    )

    renderHook(() => useTokenCompletion(79307))

    await waitFor(() =>
      expect(hoisted.markSubmissionCompletedWithToken).toHaveBeenCalledTimes(1),
    )
    expect(hoisted.invalidate).not.toHaveBeenCalled()
  })
})
