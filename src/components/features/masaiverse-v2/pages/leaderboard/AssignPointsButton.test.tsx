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
import AssignPointsButton from './AssignPointsButton'
import type { ReactNode } from 'react'

const { adminMode } = vi.hoisted(() => ({ adminMode: vi.fn() }))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  fetchMasaiverseV2AdminMode: adminMode,
}))
// Stub the form so this test focuses on gating + opening the modal.
vi.mock('./AssignPointsForm', () => ({
  default: () => <div data-testid="assign-form" />,
}))

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('AssignPointsButton', () => {
  it('renders nothing when admin mode is off', async () => {
    adminMode.mockResolvedValue({ isAdmin: false, enabled: false })
    const { container } = renderWithClient(<AssignPointsButton />)
    // Give the query a tick; the button must never appear.
    await waitFor(() => expect(adminMode).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: 'Assign points' })).toBeNull()
    expect(container.querySelector('button')).toBeNull()
  })

  it('opens the assign-points modal for an admin in admin mode', async () => {
    adminMode.mockResolvedValue({ isAdmin: true, enabled: true })
    renderWithClient(<AssignPointsButton />)

    const button = await screen.findByRole('button', { name: 'Assign points' })
    expect(screen.queryByTestId('assign-form')).toBeNull()
    fireEvent.click(button)
    expect(screen.getByTestId('assign-form')).toBeTruthy()
  })
})
