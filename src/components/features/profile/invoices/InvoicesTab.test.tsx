// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { InvoicesTab } from './InvoicesTab'
import type { ProfileInvoice } from '@/server/api/profile/profile.types'

const hoisted = vi.hoisted(() => ({
  fetchProfileInvoices: vi.fn(),
  pushGtmEvent: vi.fn(),
  open: vi.fn(),
}))

vi.mock('@/lib/api/profile/profileApi', () => ({
  fetchProfileInvoices: hoisted.fetchProfileInvoices,
}))
vi.mock('@/utils/gtm', () => ({ pushGtmEvent: hoisted.pushGtmEvent }))

function invoice(overrides: Partial<ProfileInvoice> = {}): ProfileInvoice {
  return {
    paymentType: 'Full fees',
    amount: 125000,
    paidOn: '2026-01-05T00:00:00.000Z',
    invoiceUrl: 'https://invoices.example/1.pdf',
    ...overrides,
  }
}

function renderTab() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <InvoicesTab />
    </QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

describe('InvoicesTab', () => {
  it('shows a skeleton while loading', () => {
    hoisted.fetchProfileInvoices.mockReturnValue(new Promise(() => {}))
    renderTab()
    expect(screen.getByTestId('profile-invoices-skeleton')).toBeTruthy()
  })

  it('shows an error state when the request fails', async () => {
    hoisted.fetchProfileInvoices.mockRejectedValue(new Error('boom'))
    renderTab()
    await waitFor(() =>
      expect(screen.getByTestId('profile-invoices-error')).toBeTruthy(),
    )
  })

  it('shows an empty state when there are no invoices', async () => {
    hoisted.fetchProfileInvoices.mockResolvedValue([])
    renderTab()
    const empty = await waitFor(() =>
      screen.getByTestId('profile-invoices-empty'),
    )
    expect(empty.textContent).toContain('No invoices yet')
  })

  it('lists each invoice with its type, date and rupee amount', async () => {
    hoisted.fetchProfileInvoices.mockResolvedValue([invoice()])
    renderTab()

    const item = await waitFor(() => screen.getByTestId('profile-invoice-item'))
    expect(item.textContent).toContain('Full fees')
    expect(item.textContent).toContain('₹1,25,000')
  })

  it('handles a missing date and amount', async () => {
    hoisted.fetchProfileInvoices.mockResolvedValue([
      invoice({ paidOn: null, amount: null }),
    ])
    renderTab()

    const item = await waitFor(() => screen.getByTestId('profile-invoice-item'))
    expect(item.textContent).toContain('Date unavailable')
    expect(item.textContent).not.toContain('₹')
  })

  it('falls back to the raw string for an unparseable date', async () => {
    hoisted.fetchProfileInvoices.mockResolvedValue([
      invoice({ paidOn: 'sometime last year' }),
    ])
    renderTab()

    const item = await waitFor(() => screen.getByTestId('profile-invoice-item'))
    expect(item.textContent).toContain('sometime last year')
  })

  it('shows "Preparing" instead of a broken View button when no URL exists', async () => {
    hoisted.fetchProfileInvoices.mockResolvedValue([
      invoice({ invoiceUrl: null }),
    ])
    renderTab()

    await waitFor(() =>
      expect(screen.getByTestId('profile-invoice-item')).toBeTruthy(),
    )
    expect(screen.queryByTestId('profile-invoice-view')).toBeNull()
    expect(screen.getByText('Preparing')).toBeTruthy()
  })

  it('opens the invoice in a new tab and records the click', async () => {
    hoisted.fetchProfileInvoices.mockResolvedValue([invoice()])
    vi.stubGlobal('open', hoisted.open)
    renderTab()

    fireEvent.click(
      await waitFor(() => screen.getByTestId('profile-invoice-view')),
    )

    expect(hoisted.open).toHaveBeenCalledWith(
      'https://invoices.example/1.pdf',
      '_blank',
      'noopener,noreferrer',
    )
    expect(hoisted.pushGtmEvent).toHaveBeenCalledWith(
      'l_profile_invoice_view',
      expect.objectContaining({ payment_type: 'Full fees' }),
    )
  })

  it('renders several invoices', async () => {
    hoisted.fetchProfileInvoices.mockResolvedValue([
      invoice(),
      invoice({ paymentType: 'Seat blocking', paidOn: '2025-11-01' }),
    ])
    renderTab()

    await waitFor(() =>
      expect(screen.getAllByTestId('profile-invoice-item')).toHaveLength(2),
    )
  })
})
