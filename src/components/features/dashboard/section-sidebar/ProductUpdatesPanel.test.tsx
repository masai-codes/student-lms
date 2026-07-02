// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProductUpdatesPanel } from './ProductUpdatesPanel'
import type { DashboardProductUpdate } from '@/server/api/dashboard/product-updates/getProductUpdates.service'

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

const updates: Array<DashboardProductUpdate> = [
  { id: 1, title: 'New feature A', imageUrl: null },
  { id: 2, title: 'New feature B', imageUrl: null },
]

describe('ProductUpdatesPanel', () => {
  it('shows loading and error states', () => {
    const { rerender } = render(
      <ProductUpdatesPanel updates={[]} isLoading isError={false} />,
    )
    expect(screen.getByText('Loading…')).toBeTruthy()

    rerender(<ProductUpdatesPanel updates={[]} isLoading={false} isError />)
    expect(screen.getByText('Failed to load content')).toBeTruthy()
  })

  it('shows the empty state with header + View All', () => {
    render(<ProductUpdatesPanel updates={[]} isLoading={false} isError={false} />)
    expect(screen.getByText('Product Updates')).toBeTruthy()
    expect(screen.getByTestId('dashboard-product-updates-view-all')).toBeTruthy()
    expect(screen.getByText('No content available')).toBeTruthy()
  })

  it('renders each update linking to its detail page', () => {
    render(<ProductUpdatesPanel updates={updates} isLoading={false} isError={false} />)
    expect(screen.getByText('New feature A')).toBeTruthy()
    const row = screen.getByTestId('dashboard-product-update-item-1')
    expect(row.getAttribute('to')).toBe('/whats-new/$id')
    expect(row.getAttribute('data-params')).toBe(JSON.stringify({ id: '1' }))
  })
})
