// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AdminModeToggle from './AdminModeToggle'

const { fetchAdminMode, setAdminMode } = vi.hoisted(() => ({
  fetchAdminMode: vi.fn(),
  setAdminMode: vi.fn(),
}))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  fetchMasaiverseV2AdminMode: fetchAdminMode,
  setMasaiverseV2AdminMode: setAdminMode,
}))

function renderToggle() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <AdminModeToggle />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('AdminModeToggle', () => {
  it('renders nothing while the state is loading', () => {
    fetchAdminMode.mockReturnValue(new Promise(() => {}))
    const { container } = renderToggle()
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing for non-admin users', async () => {
    fetchAdminMode.mockResolvedValue({ isAdmin: false, enabled: false })
    const { container } = renderToggle()
    await waitFor(() => expect(fetchAdminMode).toHaveBeenCalled())
    expect(container.querySelector('[role="switch"]')).toBeNull()
  })

  it('shows an off switch for an admin with admin mode disabled', async () => {
    fetchAdminMode.mockResolvedValue({ isAdmin: true, enabled: false })
    renderToggle()
    const toggle = await screen.findByRole('switch', { name: 'Enable admin mode' })
    expect(toggle.getAttribute('aria-checked')).toBe('false')
    expect(screen.getByText('Admin mode')).toBeTruthy()
  })

  it('shows an on switch for an admin with admin mode enabled', async () => {
    fetchAdminMode.mockResolvedValue({ isAdmin: true, enabled: true })
    renderToggle()
    const toggle = await screen.findByRole('switch', { name: 'Enable admin mode' })
    expect(toggle.getAttribute('aria-checked')).toBe('true')
  })

  it('toggles admin mode on and reflects the new state', async () => {
    fetchAdminMode.mockResolvedValue({ isAdmin: true, enabled: false })
    setAdminMode.mockResolvedValue({ isAdmin: true, enabled: true })
    renderToggle()

    const toggle = await screen.findByRole('switch', { name: 'Enable admin mode' })
    fireEvent.click(toggle)

    await waitFor(() => expect(setAdminMode).toHaveBeenCalledWith(true))
    await waitFor(() =>
      expect(
        screen
          .getByRole('switch', { name: 'Enable admin mode' })
          .getAttribute('aria-checked'),
      ).toBe('true'),
    )
  })
})
