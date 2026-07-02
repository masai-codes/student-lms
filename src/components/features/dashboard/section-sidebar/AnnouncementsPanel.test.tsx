// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { AnnouncementsPanel } from './AnnouncementsPanel'
import type { Announcement } from '../shared/types'

afterEach(cleanup)

const announcements: Array<Announcement> = [
  { id: '1', title: 'For you notice', author: 'Prof. A', isForYou: true },
  { id: '2', title: 'General notice', author: 'Prof. B', isForYou: false },
]

describe('AnnouncementsPanel', () => {
  it('renders each announcement and the "For You" tag only when flagged', () => {
    render(<AnnouncementsPanel announcements={announcements} />)
    expect(screen.getByText('For you notice')).toBeTruthy()
    expect(screen.getByText('General notice')).toBeTruthy()
    expect(screen.getAllByText('For You')).toHaveLength(1)
  })

  it('renders the empty state when there are no announcements', () => {
    render(<AnnouncementsPanel announcements={[]} />)
    expect(screen.getByText(/no announcements yet/i)).toBeTruthy()
  })
})
