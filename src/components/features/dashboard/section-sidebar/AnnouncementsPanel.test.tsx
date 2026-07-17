// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AnnouncementsPanel } from './AnnouncementsPanel'
import type { DashboardAnnouncement } from '@/server/api/dashboard/announcements/announcementFeed'

const navigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, params, ...props }: Record<string, unknown>) => (
    <a data-params={JSON.stringify(params)} {...props}>
      {children as React.ReactNode}
    </a>
  ),
  useNavigate: () => navigate,
}))

afterEach(cleanup)

const item = (over: Partial<DashboardAnnouncement>): DashboardAnnouncement => ({
  id: 1,
  source: 'a',
  title: 'Notice',
  body: '',
  authorName: 'Prof. A',
  isForYou: false,
  ctaName: null,
  ctaLink: null,
  ...over,
})

describe('AnnouncementsPanel', () => {
  it('shows a spinner while loading and the failure message on error', () => {
    const { rerender } = render(
      <AnnouncementsPanel announcements={[]} isLoading isError={false} />,
    )
    expect(screen.getByText('Loading…')).toBeTruthy()

    rerender(
      <AnnouncementsPanel announcements={[]} isLoading={false} isError />,
    )
    expect(screen.getByText('Failed to load content')).toBeTruthy()
  })

  it('keeps the card and shows "No announcements yet" when the fetch succeeded with none', () => {
    render(
      <AnnouncementsPanel
        announcements={[]}
        isLoading={false}
        isError={false}
      />,
    )
    expect(screen.getByTestId('dashboard-announcements-panel')).toBeTruthy()
    expect(screen.getByText('No announcements yet')).toBeTruthy()
  })

  it('renders rows, the "For you" badge only on messages, and correct links', () => {
    render(
      <AnnouncementsPanel
        isLoading={false}
        isError={false}
        announcements={[
          item({ id: 5, source: 'a', title: 'Announcement' }),
          item({ id: 6, source: 'm', title: 'Message', isForYou: true }),
        ]}
      />,
    )
    expect(screen.getByText('Announcement')).toBeTruthy()
    expect(screen.getByText('Message')).toBeTruthy()
    expect(screen.getAllByText('For you')).toHaveLength(1)

    // Announcement → /announcements/$id ; message → /messages/$id
    expect(
      screen.getByTestId('dashboard-announcement-item-a-5').getAttribute('to'),
    ).toBe('/announcements/$id')
    expect(
      screen.getByTestId('dashboard-announcement-item-m-6').getAttribute('to'),
    ).toBe('/messages/$id')
  })
})
