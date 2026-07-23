// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type * as TanstackRouter from '@tanstack/react-router'
import { AnnouncementCard } from './AnnouncementCard'
import type { AnnouncementItem } from '@/server/api/announcement/getAnnouncements.service'

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof TanstackRouter>()
  return {
    ...actual,
    Link: ({ children, params, to, ...props }: Record<string, unknown>) => (
      <a data-to={String(to)} {...props}>
        {children as React.ReactNode}
      </a>
    ),
  }
})

const baseItem: AnnouncementItem = {
  id: '42',
  source: 'a',
  title: 'Midterm schedule',
  authorName: 'Ada Instructor',
  createdAt: '2026-07-20T10:00:00.000Z',
  isForYou: false,
  type: 'info',
  isUnread: false,
}

afterEach(cleanup)

describe('AnnouncementCard', () => {
  it('links an announcement to the announcement detail route', () => {
    render(<AnnouncementCard item={baseItem} />)
    const link = screen.getByTestId('announcements-item-a-42')
    expect(link.getAttribute('data-to')).toBe('/announcements/$id')
    expect(screen.getByText('Midterm schedule')).toBeTruthy()
    expect(screen.getByText('Ada Instructor')).toBeTruthy()
  })

  it('links a message to the message detail route', () => {
    render(
      <AnnouncementCard item={{ ...baseItem, id: '7', source: 'm' }} />,
    )
    expect(
      screen.getByTestId('announcements-item-m-7').getAttribute('data-to'),
    ).toBe('/messages/$id')
  })

  it('tints the icon red for critical announcements', () => {
    render(<AnnouncementCard item={{ ...baseItem, type: 'critical' }} />)
    const icon = document.querySelector('img[alt=""]') as HTMLImageElement
    expect(icon.style.filter).not.toBe('')
  })

  it('shows the unread dot and For-you badge when applicable', () => {
    render(
      <AnnouncementCard
        item={{ ...baseItem, isUnread: true, isForYou: true }}
      />,
    )
    expect(screen.getByText('For you')).toBeTruthy()
  })

  it('falls back to an empty author when none is provided', () => {
    render(<AnnouncementCard item={{ ...baseItem, authorName: '' }} />)
    expect(screen.getByTestId('announcements-item-a-42')).toBeTruthy()
  })
})
