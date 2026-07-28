// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { BookmarkCard } from './BookmarkCard'
import type { BookmarkItem } from '@/server/api/bookmarks/getBookmarks.service'

const base: BookmarkItem = {
  id: '10',
  ctaUrl: '/lectures/55',
  title: 'Intro to Trees',
  subtitle: 'DSA — Module 2',
  meta: '',
  author: 'Ada',
  savedAt: '2026-07-20T10:00:00.000Z',
  entityType: 'lecture',
  isForYou: false,
}

afterEach(cleanup)

describe('BookmarkCard', () => {
  it('renders the title, author, testid and cta href', () => {
    render(<BookmarkCard item={base} />)
    const link = screen.getByTestId('bookmarks-item-10')
    expect(link.getAttribute('href')).toBe('/lectures/55')
    expect(screen.getByText('Intro to Trees')).toBeTruthy()
    expect(screen.getByText('Ada')).toBeTruthy()
  })

  it('shows the For-you badge only when flagged', () => {
    const { rerender } = render(<BookmarkCard item={base} />)
    expect(screen.queryByText('For You')).toBeNull()
    rerender(<BookmarkCard item={{ ...base, isForYou: true }} />)
    expect(screen.getByText('For You')).toBeTruthy()
  })

  it('renders across entity types without an author', () => {
    for (const entityType of [
      'resource',
      'assignment',
      'announcement',
      'ticket',
      'masaiverse',
    ] as const) {
      render(
        <BookmarkCard
          item={{ ...base, id: entityType, entityType, author: '' }}
        />,
      )
      expect(screen.getByTestId(`bookmarks-item-${entityType}`)).toBeTruthy()
      cleanup()
    }
  })
})
