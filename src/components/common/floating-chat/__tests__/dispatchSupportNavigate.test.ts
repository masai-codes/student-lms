/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  dispatchSupportNavigate,
  isSupportNavigateCategory,
} from '../dispatchSupportNavigate'

describe('isSupportNavigateCategory', () => {
  it('accepts supported learn categories', () => {
    expect(isSupportNavigateCategory('lecture')).toBe(true)
    expect(isSupportNavigateCategory('assignment')).toBe(true)
    expect(isSupportNavigateCategory('resource')).toBe(true)
    expect(isSupportNavigateCategory('evaluation')).toBe(true)
  })

  it('rejects unknown categories', () => {
    expect(isSupportNavigateCategory('ticket')).toBe(false)
    expect(isSupportNavigateCategory('')).toBe(false)
  })
})

describe('dispatchSupportNavigate', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('dispatches support-navigate with string entityId', () => {
    const listener = vi.fn()
    window.addEventListener('support-navigate', listener)

    dispatchSupportNavigate({ category: 'lecture', entityId: 157894 })

    expect(listener).toHaveBeenCalledTimes(1)
    const event = listener.mock.calls[0]?.[0] as CustomEvent<{
      category: string
      entityId: string
    }>
    expect(event.type).toBe('support-navigate')
    expect(event.detail).toEqual({
      category: 'lecture',
      entityId: '157894',
    })
  })

  it('ignores unknown categories', () => {
    const listener = vi.fn()
    window.addEventListener('support-navigate', listener)

    dispatchSupportNavigate({ category: 'other', entityId: 1 })

    expect(listener).not.toHaveBeenCalled()
  })

  it('ignores missing entityId', () => {
    const listener = vi.fn()
    window.addEventListener('support-navigate', listener)

    dispatchSupportNavigate({ category: 'lecture', entityId: undefined })
    dispatchSupportNavigate({ category: 'lecture', entityId: null })
    dispatchSupportNavigate({ category: 'lecture', entityId: '' })

    expect(listener).not.toHaveBeenCalled()
  })
})
