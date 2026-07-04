// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WelcomeModalGate } from './WelcomeModalGate'

const hoisted = vi.hoisted(() => {
  const create = vi.fn(() => Object.assign(vi.fn(), { reset: vi.fn() }))
  return {
    fetchStatus: vi.fn(),
    dismiss: vi.fn(),
    confetti: Object.assign(vi.fn(), { create }),
    isMobile: vi.fn(),
  }
})

vi.mock('canvas-confetti', () => ({ default: hoisted.confetti }))
vi.mock('@/components/features/chatbot/hooks/useIsMobileViewport', () => ({
  useIsMobileViewport: () => hoisted.isMobile(),
}))
vi.mock('@/lib/api/dashboard/dashboardApi', () => ({
  fetchWelcomeModalStatus: hoisted.fetchStatus,
  dismissWelcomeModalApi: hoisted.dismiss,
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
beforeEach(() => {
  hoisted.isMobile.mockReturnValue(false)
  hoisted.dismiss.mockResolvedValue(undefined)
})

function renderGate() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <WelcomeModalGate />
    </QueryClientProvider>,
  )
}

describe('WelcomeModalGate', () => {
  it('renders nothing when the backend says not to show the modal', async () => {
    hoisted.fetchStatus.mockResolvedValue({ showWelcomeModal: false })
    renderGate()
    await waitFor(() => expect(hoisted.fetchStatus).toHaveBeenCalled())
    expect(screen.queryByTestId('welcome-modal-title')).toBeNull()
  })

  it('shows the modal when eligible', async () => {
    hoisted.fetchStatus.mockResolvedValue({ showWelcomeModal: true })
    renderGate()
    await waitFor(() => expect(screen.getByTestId('welcome-modal-title')).toBeTruthy())
  })

  it('persists dismissal and hides the modal on Get Started', async () => {
    hoisted.fetchStatus.mockResolvedValue({ showWelcomeModal: true })
    renderGate()
    await waitFor(() => expect(screen.getByTestId('welcome-modal-get-started')).toBeTruthy())

    fireEvent.click(screen.getByTestId('welcome-modal-get-started'))

    await waitFor(() => expect(hoisted.dismiss).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.queryByTestId('welcome-modal-title')).toBeNull())
  })
})
