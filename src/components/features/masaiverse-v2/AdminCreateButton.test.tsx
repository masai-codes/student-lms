// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AdminCreateButton from './AdminCreateButton'

const { fetchAdminMode, createEvent, createClub } = vi.hoisted(() => ({
  fetchAdminMode: vi.fn(),
  createEvent: vi.fn(),
  createClub: vi.fn(),
}))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  fetchMasaiverseV2AdminMode: fetchAdminMode,
  createMasaiverseV2Event: createEvent,
  createMasaiverseV2Club: createClub,
}))

function renderButton(kind: 'event' | 'club') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
  const utils = render(
    <QueryClientProvider client={client}>
      <AdminCreateButton kind={kind} />
    </QueryClientProvider>,
  )
  return { ...utils, invalidateSpy }
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('AdminCreateButton', () => {
  it('renders nothing while loading and for non-enabled users', async () => {
    fetchAdminMode.mockResolvedValue({ isAdmin: false, enabled: false })
    const { container } = renderButton('event')
    await waitFor(() => expect(fetchAdminMode).toHaveBeenCalled())
    expect(container.querySelector('button')).toBeNull()
  })

  it('creates an event and invalidates the events + home lists', async () => {
    fetchAdminMode.mockResolvedValue({ isAdmin: true, enabled: true })
    createEvent.mockResolvedValue({ id: '77' })
    const { invalidateSpy } = renderButton('event')

    const button = await screen.findByRole('button', { name: /add an event/i })
    fireEvent.click(button)

    await waitFor(() => expect(createEvent).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['masaiverse-v2', 'events'],
      }),
    )
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['masaiverse-v2', 'home'],
    })
  })

  it('creates a club and invalidates the home list', async () => {
    fetchAdminMode.mockResolvedValue({ isAdmin: true, enabled: true })
    createClub.mockResolvedValue({ id: '31' })
    const { invalidateSpy } = renderButton('club')

    const button = await screen.findByRole('button', { name: /add a club/i })
    fireEvent.click(button)

    await waitFor(() => expect(createClub).toHaveBeenCalledTimes(1))
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['masaiverse-v2', 'home'],
    })
    expect(createEvent).not.toHaveBeenCalled()
  })
})
