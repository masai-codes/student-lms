// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AnnouncementPopupModal } from './AnnouncementPopupModal'
import type { PopupItem } from '@/server/api/announcement/getAnnouncementPopups.service'

afterEach(cleanup)

const item = (over: Partial<PopupItem> = {}): PopupItem => ({
  id: '1',
  source: 'a',
  title: 'Hello',
  body: 'Body text',
  ctaName: null,
  ctaLink: null,
  ...over,
})

const handlers = () => ({ onShowLater: vi.fn(), onMarkRead: vi.fn(), onCta: vi.fn() })

describe('AnnouncementPopupModal', () => {
  it('renders the title + "Show me later" and has no close (X) button', () => {
    render(<AnnouncementPopupModal open item={item()} isSubmitting={false} {...handlers()} />)
    expect(screen.getByTestId('announcement-popup-title').textContent).toBe('Hello')
    expect(screen.getByTestId('announcement-popup-show-later')).toBeTruthy()
    // No close (X) affordance — dismissal is only via "Show me later" / backdrop.
    expect(screen.queryByLabelText('Close')).toBeNull()
  })

  it('shows "Mark as read" (not a CTA) when the popup has no link, and fires onMarkRead', () => {
    const h = handlers()
    render(<AnnouncementPopupModal open item={item()} isSubmitting={false} {...h} />)
    expect(screen.queryByTestId('announcement-popup-cta')).toBeNull()
    fireEvent.click(screen.getByTestId('announcement-popup-mark-read'))
    expect(h.onMarkRead).toHaveBeenCalledTimes(1)
  })

  it('shows the CTA alongside "Mark as read" when the popup has a link', () => {
    const h = handlers()
    render(
      <AnnouncementPopupModal
        open
        item={item({ ctaName: 'Open', ctaLink: 'https://x.test' })}
        isSubmitting={false}
        {...h}
      />,
    )
    // Both actions are present: the CTA and an always-available "Mark as read".
    expect(screen.getByTestId('announcement-popup-mark-read')).toBeTruthy()
    fireEvent.click(screen.getByTestId('announcement-popup-cta'))
    expect(h.onCta).toHaveBeenCalledTimes(1)
  })

  it('"Mark as read" is still present and fires onMarkRead even with a link CTA', () => {
    const h = handlers()
    render(
      <AnnouncementPopupModal
        open
        item={item({ ctaName: 'Open', ctaLink: 'https://x.test' })}
        isSubmitting={false}
        {...h}
      />,
    )
    fireEvent.click(screen.getByTestId('announcement-popup-mark-read'))
    expect(h.onMarkRead).toHaveBeenCalledTimes(1)
  })

  it('"Show me later" fires onShowLater', () => {
    const h = handlers()
    render(<AnnouncementPopupModal open item={item()} isSubmitting={false} {...h} />)
    fireEvent.click(screen.getByTestId('announcement-popup-show-later'))
    expect(h.onShowLater).toHaveBeenCalledTimes(1)
  })

  it('renders nothing when there is no item', () => {
    render(<AnnouncementPopupModal open={false} item={null} isSubmitting={false} {...handlers()} />)
    expect(screen.queryByTestId('announcement-popup-modal')).toBeNull()
  })
})
