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
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
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
    const { result } = renderHook(() => useAnnouncementPopups(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.current?.id).toBe('1'))
    act(() => result.current.handleMarkRead())
    await waitFor(() => expect(hoisted.markAnnouncementRead).toHaveBeenCalledWith(1))
    await waitFor(() => expect(result.current.current?.id).toBe('2'))
  })

  it('"show me later" advances without marking read', async () => {
    hoisted.fetchPopups.mockResolvedValue([ann('1'), ann('2')])
    const { result } = renderHook(() => useAnnouncementPopups(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.current?.id).toBe('1'))
    act(() => result.current.handleShowLater())
    await waitFor(() => expect(result.current.current?.id).toBe('2'))
    expect(hoisted.markAnnouncementRead).not.toHaveBeenCalled()
  })

  it('CTA opens the link and marks read', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    hoisted.fetchPopups.mockResolvedValue([ann('9', { ctaName: 'Open', ctaLink: 'https://x.test' })])
    const { result } = renderHook(() => useAnnouncementPopups(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.current?.id).toBe('9'))
    act(() => result.current.handleCta())
    expect(openSpy).toHaveBeenCalledWith('https://x.test', '_blank', 'noopener,noreferrer')
    await waitFor(() => expect(hoisted.markAnnouncementRead).toHaveBeenCalledWith(9))
    openSpy.mockRestore()
  })

  it('marks message popups read via the message endpoint', async () => {
    hoisted.fetchPopups.mockResolvedValue([ann('5', { source: 'm' })])
    const { result } = renderHook(() => useAnnouncementPopups(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.current?.id).toBe('5'))
    act(() => result.current.handleMarkRead())
    await waitFor(() => expect(hoisted.markMessageRead).toHaveBeenCalledWith(5))
    expect(hoisted.markAnnouncementRead).not.toHaveBeenCalled()
  })
})
