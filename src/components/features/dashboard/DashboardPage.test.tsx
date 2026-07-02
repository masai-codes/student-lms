// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { DashboardPage } from './DashboardPage'

beforeAll(() => {
  const NoopObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = NoopObserver
  globalThis.IntersectionObserver =
    NoopObserver as unknown as typeof IntersectionObserver
})

afterEach(cleanup)

describe('DashboardPage', () => {
  it('renders the full dashboard from mock data', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Welcome')).toBeTruthy()
    expect(screen.getByText(/Suryakumar/)).toBeTruthy()
    expect(screen.getByText('Announcements')).toBeTruthy()
    expect(screen.getByText('Product Updates')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Take Photo' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /My Schedule/ })).toBeTruthy()
  })
})
