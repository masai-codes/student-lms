// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { OnboardingStepsBanner } from './OnboardingStepsBanner'
import type { OnboardingBanner } from './onboardingBanners'

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

const banner = (over: Partial<OnboardingBanner> = {}): OnboardingBanner => ({
  batchId: 5,
  courseTitle: 'MERN',
  completed: 2,
  total: 5,
  targetTab: 'lms',
  ...over,
})

describe('OnboardingStepsBanner', () => {
  it('renders nothing when there are no banners', () => {
    const { container } = render(<OnboardingStepsBanner banners={[]} onResume={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('features the remaining-steps count and shows the fraction + title for a single course', () => {
    render(<OnboardingStepsBanner banners={[banner()]} onResume={vi.fn()} />)
    expect(screen.getByTestId('dashboard-onboarding-banner-title').textContent).toContain('MERN')
    // 2 of 5 done → 3 remaining is the hero count; fraction stays as context.
    expect(screen.getByTestId('dashboard-onboarding-banner-count').textContent).toBe('3steps left')
    expect(screen.getByTestId('dashboard-onboarding-banner-progress').textContent).toContain('2/5')
    expect(screen.queryByTestId('dashboard-onboarding-banner-dots')).toBeNull()
  })

  it('singularizes the count when only one step is left', () => {
    render(<OnboardingStepsBanner banners={[banner({ completed: 4, total: 5 })]} onResume={vi.fn()} />)
    expect(screen.getByTestId('dashboard-onboarding-banner-count').textContent).toBe('1step left')
  })

  it('resumes on the course + tab the banner points at', () => {
    const onResume = vi.fn()
    render(<OnboardingStepsBanner banners={[banner({ batchId: 9, targetTab: 'program' })]} onResume={onResume} />)
    fireEvent.click(screen.getByTestId('dashboard-onboarding-banner-resume'))
    expect(onResume).toHaveBeenCalledWith(9, 'program')
  })

  it('renders one centered dot per course when there are multiple', () => {
    render(
      <OnboardingStepsBanner
        banners={[banner({ batchId: 5, courseTitle: 'MERN' }), banner({ batchId: 6, courseTitle: 'Data Analytics' })]}
        onResume={vi.fn()}
      />,
    )
    const dots = screen.getByTestId('dashboard-onboarding-banner-dots')
    expect(dots.querySelectorAll('button')).toHaveLength(2)
  })
})
