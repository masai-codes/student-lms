// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import HighlightsCarousel from './HighlightsCarousel'
import type { MasaiverseV2HomeHighlight } from '@/server/api/masaiverse-v2/services/getHomeHighlights.service'
import type { ReactNode } from 'react'

// HighlightCard renders a router <Link>; Swiper needs layout APIs jsdom lacks.
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => children,
}))
vi.mock('swiper/react', () => ({
  Swiper: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SwiperSlide: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock('swiper/modules', () => ({ Navigation: {} }))

function highlight(id: string, title: string): MasaiverseV2HomeHighlight {
  return {
    id,
    aboveTitle: null,
    title,
    belowTitle: null,
    pastEventEmojiValue: null,
    startTime: null,
  }
}

afterEach(cleanup)

describe('HighlightsCarousel', () => {
  it('renders the loading state', () => {
    render(
      <HighlightsCarousel
        highlights={[]}
        isPending
        loadingLabel="Loading past events"
        emptyMessage="Nothing here"
      />,
    )
    expect(screen.getByLabelText('Loading past events')).toBeTruthy()
  })

  it('renders the empty message', () => {
    render(
      <HighlightsCarousel
        highlights={[]}
        isPending={false}
        loadingLabel="Loading past events"
        emptyMessage="No past events"
      />,
    )
    expect(screen.getByText('No past events')).toBeTruthy()
  })

  it('renders a single highlight without nav controls', () => {
    render(
      <HighlightsCarousel
        highlights={[highlight('1', 'Solo Recap')]}
        isPending={false}
        loadingLabel="Loading past events"
        emptyMessage="No past events"
      />,
    )
    expect(screen.getByText('Solo Recap')).toBeTruthy()
    expect(screen.queryByLabelText('Next highlights')).toBeNull()
  })

  it('renders nav controls when there is more than one highlight', () => {
    render(
      <HighlightsCarousel
        highlights={[highlight('1', 'First'), highlight('2', 'Second')]}
        isPending={false}
        loadingLabel="Loading past events"
        emptyMessage="No past events"
        navKey="club-highlights"
      />,
    )
    expect(screen.getByLabelText('Next highlights')).toBeTruthy()
  })
})
