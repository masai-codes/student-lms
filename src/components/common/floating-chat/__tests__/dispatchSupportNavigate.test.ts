/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  dispatchSupportNavigate,
  isSupportNavigateCategory,
  SUPPORT_IFRAME_MESSAGE_SOURCE,
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

  it('does not post to the host when not embedded', () => {
    const post = vi.spyOn(window.parent, 'postMessage')

    dispatchSupportNavigate({ category: 'lecture', entityId: 1 })

    // jsdom's window.parent === window, so this stands in for "top level".
    expect(post).not.toHaveBeenCalled()
  })

  it('posts the deep-link to the embedding host when in an iframe', () => {
    const post = vi.fn()
    vi.spyOn(window, 'parent', 'get').mockReturnValue({
      postMessage: post,
    } as unknown as Window)
    vi.spyOn(document, 'referrer', 'get').mockReturnValue(
      'https://lms.masaischool.com/support',
    )

    dispatchSupportNavigate({
      category: 'assignment',
      entityId: 42,
      href: '/assignments/42',
    })

    expect(post).toHaveBeenCalledWith(
      {
        source: SUPPORT_IFRAME_MESSAGE_SOURCE,
        type: 'support-navigate',
        category: 'assignment',
        entityId: '42',
        href: '/assignments/42',
      },
      'https://lms.masaischool.com',
    )
  })

  it('falls back to a wildcard target when the referrer is stripped', () => {
    const post = vi.fn()
    vi.spyOn(window, 'parent', 'get').mockReturnValue({
      postMessage: post,
    } as unknown as Window)
    vi.spyOn(document, 'referrer', 'get').mockReturnValue('')

    dispatchSupportNavigate({ category: 'lecture', entityId: 7 })

    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'lecture',
        entityId: '7',
        href: null,
      }),
      '*',
    )
  })
})
