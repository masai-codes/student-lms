// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useSelectedLearnBatchId } from '../useSelectedLearnBatchId'
import { setLastSelectedBatchIdForUser } from '@/lib/learnBatchSelection'

const hoisted = vi.hoisted(() => {
  const state: { search: Record<string, unknown> } = { search: {} }
  return state
})

vi.mock('@tanstack/react-router', () => ({
  useRouterState: ({ select }: { select: (state: any) => unknown }) =>
    select({ location: { pathname: '/learn', search: hoisted.search } }),
}))

function renderForUser(userId: string) {
  return renderHook(() => useSelectedLearnBatchId(userId)).result
}

describe('useSelectedLearnBatchId', () => {
  afterEach(() => {
    hoisted.search = {}
    window.localStorage.clear()
  })

  it('prefers the live ?batchId over the stored last selection', () => {
    setLastSelectedBatchIdForUser('u-search', 11)
    hoisted.search = { batchId: 22 }

    expect(renderForUser('u-search').current).toBe(22)
  })

  it('accepts a string batchId from the URL', () => {
    hoisted.search = { batchId: '22' }

    expect(renderForUser('u-string').current).toBe(22)
  })

  it('falls back to the stored selection when the URL carries no batch', () => {
    setLastSelectedBatchIdForUser('u-stored', 11)

    expect(renderForUser('u-stored').current).toBe(11)
  })

  it('returns undefined when neither source has a usable batch', () => {
    hoisted.search = { batchId: 'not-a-batch' }

    expect(renderForUser('u-empty').current).toBeUndefined()
  })
})
