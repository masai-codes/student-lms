// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAnnouncementPopups } from './useAnnouncementPopups'
import type { PopupItem } from '@/server/api/announcement/getAnnouncementPopups.service'

const hoisted = vi.hoisted(() => ({
  fetchPopups: vi.fn(),
  markAnnouncementRead: vi.fn(),
  markMessageRead: vi.fn(),
}))

vi.mock('@/lib/api/announcement/announcementApi', () => ({
  fetchAnnouncementPopups: hoisted.fetchPopups,
  markAnnouncementRead: hoisted.markAnnouncementRead,
  markMessageRead: hoisted.markMessageRead,
}))

const ann = (id: string, over: Partial<PopupItem> = {}): PopupItem => ({
  id,
  source: 'a',
  title: `T${id}`,
  body: 'body',
  ctaName: null,
  ctaLink: null,
  ...over,
})

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

beforeEach(() => {
  hoisted.markAnnouncementRead.mockResolvedValue(undefined)
  hoisted.markMessageRead.mockResolvedValue(undefined)
})
afterEach(() => vi.clearAllMocks())

describe('useAnnouncementPopups', () => {
  it('shows popups one at a time; mark-read marks it and advances', async () => {
    hoisted.fetchPopups.mockResolvedValue([ann('1'), ann('2')])
    const { result } = renderHook(() => useAnnouncementPopups(), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.current?.id).toBe('1'))
    act(() => result.current.handleMarkRead())
    await waitFor(() =>
      expect(hoisted.markAnnouncementRead).toHaveBeenCalledWith(1),
    )
    await waitFor(() => expect(result.current.current?.id).toBe('2'))
  })

  it('"show me later" advances without marking read', async () => {
    hoisted.fetchPopups.mockResolvedValue([ann('1'), ann('2')])
    const { result } = renderHook(() => useAnnouncementPopups(), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.current?.id).toBe('1'))
    act(() => result.current.handleShowLater())
    await waitFor(() => expect(result.current.current?.id).toBe('2'))
    expect(hoisted.markAnnouncementRead).not.toHaveBeenCalled()
  })

  it('CTA marks read and closes first, then opens the link', async () => {
    vi.useFakeTimers()
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    try {
      hoisted.fetchPopups.mockResolvedValue([
        ann('9', { ctaName: 'Open', ctaLink: 'https://x.test' }),
      ])
      const { result } = renderHook(() => useAnnouncementPopups(), {
        wrapper: makeWrapper(),
      })

      await vi.waitFor(() => expect(result.current.current?.id).toBe('9'))
      act(() => result.current.handleCta())

      // Marks read and starts closing immediately — but does NOT open the link yet.
      await vi.waitFor(() =>
        expect(hoisted.markAnnouncementRead).toHaveBeenCalledWith(9),
      )
      expect(result.current.open).toBe(false)
      expect(openSpy).not.toHaveBeenCalled()

      // The link opens only after the close-animation window elapses.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300)
      })
      expect(openSpy).toHaveBeenCalledWith(
        'https://x.test',
        '_blank',
        'noopener,noreferrer',
      )
    } finally {
      openSpy.mockRestore()
      vi.useRealTimers()
    }
  })

  it('mark-read works for popups that have a link CTA', async () => {
    hoisted.fetchPopups.mockResolvedValue([
      ann('7', { ctaName: 'Open', ctaLink: 'https://x.test' }),
    ])
    const { result } = renderHook(() => useAnnouncementPopups(), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.current?.id).toBe('7'))
    act(() => result.current.handleMarkRead())
    await waitFor(() =>
      expect(hoisted.markAnnouncementRead).toHaveBeenCalledWith(7),
    )
  })

  it('marks message popups read via the message endpoint', async () => {
    hoisted.fetchPopups.mockResolvedValue([ann('5', { source: 'm' })])
    const { result } = renderHook(() => useAnnouncementPopups(), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.current?.id).toBe('5'))
    act(() => result.current.handleMarkRead())
    await waitFor(() => expect(hoisted.markMessageRead).toHaveBeenCalledWith('5'))
    expect(hoisted.markAnnouncementRead).not.toHaveBeenCalled()
  })

  it('opens the first popup and keeps `open` true while it is shown', async () => {
    hoisted.fetchPopups.mockResolvedValue([ann('1')])
    const { result } = renderHook(() => useAnnouncementPopups(), {
      wrapper: makeWrapper(),
    })

    await waitFor(() => expect(result.current.current?.id).toBe('1'))
    expect(result.current.open).toBe(true)
  })

  it('closes (open=false, current kept) before advancing so popups never overlap', async () => {
    vi.useFakeTimers()
    try {
      hoisted.fetchPopups.mockResolvedValue([ann('1'), ann('2')])
      const { result } = renderHook(() => useAnnouncementPopups(), {
        wrapper: makeWrapper(),
      })

      // First popup surfaces (advance real-time-independent query resolution).
      await vi.waitFor(() => expect(result.current.current?.id).toBe('1'))
      expect(result.current.open).toBe(true)

      // Action starts the close animation: modal hides but still shows popup 1.
      act(() => result.current.handleShowLater())
      expect(result.current.open).toBe(false)
      expect(result.current.current?.id).toBe('1')

      // Next popup only appears once the close animation window elapses.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300)
      })
      await vi.waitFor(() => expect(result.current.current?.id).toBe('2'))
      expect(result.current.open).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })
})
