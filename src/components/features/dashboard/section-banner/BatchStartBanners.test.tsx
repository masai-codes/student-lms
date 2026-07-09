// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { BatchStartBanners } from './BatchStartBanners'
import type { BatchStartBanner } from '@/server/api/dashboard/getBatchStartBanners.service'

// embla (drag carousel) relies on ResizeObserver + IntersectionObserver.
beforeAll(() => {
  const NoopObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = NoopObserver
  globalThis.IntersectionObserver = NoopObserver as unknown as typeof IntersectionObserver
})

afterEach(cleanup)

const banner = (over: Partial<BatchStartBanner> = {}): BatchStartBanner => ({
  batchId: 5,
  courseTitle: 'MERN',
  startDate: '2026-08-12',
  startDateLabel: '12 Aug 2026',
  ...over,
})

describe('BatchStartBanners', () => {
  it('renders nothing when there are no banners', () => {
    const { container } = render(<BatchStartBanners banners={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows the course name + start date and no dots for a single batch', () => {
    render(<BatchStartBanners banners={[banner()]} />)
    const text = screen.getByTestId('dashboard-batch-start-text').textContent
    expect(text).toContain('MERN')
    expect(text).toContain('will start on')
    expect(text).toContain('12 Aug 2026')
    expect(screen.queryByTestId('dashboard-batch-start-dots')).toBeNull()
    expect(screen.queryByTestId('dashboard-batch-start-prev')).toBeNull()
    expect(screen.queryByTestId('dashboard-batch-start-next')).toBeNull()
  })

  it('renders one slide + one dot per batch when there are multiple', () => {
    render(
      <BatchStartBanners
        banners={[
          banner({ batchId: 5, courseTitle: 'MERN' }),
          banner({ batchId: 6, courseTitle: 'Data Analytics', startDateLabel: '01 Sep 2026' }),
        ]}
      />,
    )
    expect(screen.getAllByTestId('dashboard-batch-start-text')).toHaveLength(2)
    expect(screen.getByTestId('dashboard-batch-start-dots').querySelectorAll('button')).toHaveLength(2)
    expect(screen.getByTestId('dashboard-batch-start-prev')).toBeTruthy()
    expect(screen.getByTestId('dashboard-batch-start-next')).toBeTruthy()
  })
})
