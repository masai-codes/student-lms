// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { FeePaymentBanners } from './FeePaymentBanners'
import type { FeePaymentBanner } from '@/server/api/dashboard/t0/getFeePaymentBanner.service'

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

const timer = (
  over: {
    daysRemaining?: number
    hoursRemaining?: number | null
    paymentUrl?: string | null
    batchId?: number
    courseTitle?: string
  } = {},
): FeePaymentBanner => ({
  type: 'timer',
  daysRemaining: over.daysRemaining ?? 7,
  hoursRemaining: over.hoursRemaining ?? null,
  paymentUrl: over.paymentUrl === undefined ? 'https://pay.test/x' : over.paymentUrl,
  batchId: over.batchId ?? 5,
  courseTitle: over.courseTitle ?? 'MERN',
})

describe('FeePaymentBanners', () => {
  it('renders nothing when there are no banners', () => {
    const { container } = render(<FeePaymentBanners banners={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('timer: shows the course name, days pill, active CTA, and no dots for one batch', () => {
    render(<FeePaymentBanners banners={[timer()]} />)
    expect(screen.getByTestId('dashboard-fee-payment-banner').getAttribute('data-variant')).toBe('timer')
    expect(screen.getByTestId('dashboard-fee-payment-course').textContent).toBe('MERN')
    expect(screen.getByText(/Pay your remaining program fee/)).toBeTruthy()
    expect(screen.getByTestId('dashboard-fee-payment-days').textContent).toBe('7 days remaining')
    expect(screen.getByTestId('dashboard-fee-payment-cta').getAttribute('href')).toBe('https://pay.test/x')
    expect(screen.queryByTestId('dashboard-fee-payment-dots')).toBeNull()
    // No prev/next arrows for a single banner.
    expect(screen.queryByTestId('dashboard-fee-payment-prev')).toBeNull()
    expect(screen.queryByTestId('dashboard-fee-payment-next')).toBeNull()
  })

  it('timer: shows hours remaining when less than a day is left', () => {
    render(<FeePaymentBanners banners={[timer({ daysRemaining: 0, hoursRemaining: 5 })]} />)
    expect(screen.getByTestId('dashboard-fee-payment-days').textContent).toBe('5 hours remaining')
  })

  it('compact: keeps course, days pill, message, and CTA (stacked for narrow panels)', () => {
    render(<FeePaymentBanners banners={[timer()]} compact />)
    expect(screen.getByTestId('dashboard-fee-payment-course').textContent).toBe('MERN')
    expect(screen.getByTestId('dashboard-fee-payment-days').textContent).toBe('7 days remaining')
    expect(screen.getByText(/Pay your remaining program fee/)).toBeTruthy()
    expect(screen.getByTestId('dashboard-fee-payment-cta').getAttribute('href')).toBe('https://pay.test/x')
  })

  it('overdue: shows the overdue message, course name, and a days-overdue pill', () => {
    render(
      <FeePaymentBanners
        banners={[{ type: 'overdue', daysOverdue: 3, paymentUrl: 'https://pay.test/x', batchId: 6, courseTitle: 'Data Analytics' }]}
      />,
    )
    expect(screen.getByTestId('dashboard-fee-payment-banner').getAttribute('data-variant')).toBe('overdue')
    expect(screen.getByTestId('dashboard-fee-payment-course').textContent).toBe('Data Analytics')
    expect(screen.getByText(/Payment Overdue!/)).toBeTruthy()
    expect(screen.getByTestId('dashboard-fee-payment-days').textContent).toBe('3 days overdue')
  })

  it('renders one slide + one dot per batch when there are multiple', () => {
    render(
      <FeePaymentBanners
        banners={[
          timer({ batchId: 5, courseTitle: 'MERN' }),
          { type: 'overdue', daysOverdue: 1, paymentUrl: null, batchId: 6, courseTitle: 'Data Analytics' },
        ]}
      />,
    )
    expect(screen.getAllByTestId('dashboard-fee-payment-banner')).toHaveLength(2)
    expect(screen.getByTestId('dashboard-fee-payment-dots').querySelectorAll('button')).toHaveLength(2)
    // Prev/next arrows appear alongside the dots for multiple banners.
    expect(screen.getByTestId('dashboard-fee-payment-prev')).toBeTruthy()
    expect(screen.getByTestId('dashboard-fee-payment-next')).toBeTruthy()
  })

  it('disables the CTA when a batch has no payment URL', () => {
    render(<FeePaymentBanners banners={[timer({ paymentUrl: null })]} />)
    const cta = screen.getByTestId('dashboard-fee-payment-cta')
    expect(cta.getAttribute('aria-disabled')).toBe('true')
    expect(cta.getAttribute('href')).toBeNull()
  })
})
