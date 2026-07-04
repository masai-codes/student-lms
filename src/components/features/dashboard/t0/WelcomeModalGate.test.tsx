// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WelcomeModalGate } from './WelcomeModalGate'

const hoisted = vi.hoisted(() => {
  const create = vi.fn(() => Object.assign(vi.fn(), { reset: vi.fn() }))
  return {
    dismiss: vi.fn(),
    confetti: Object.assign(vi.fn(), { create }),
    isMobile: vi.fn(),
  }
})

vi.mock('canvas-confetti', () => ({ default: hoisted.confetti }))
vi.mock('@/components/features/chatbot/hooks/useIsMobileViewport', () => ({
  useIsMobileViewport: () => hoisted.isMobile(),
}))
vi.mock('@/lib/api/dashboard/dashboardApi', () => ({ dismissWelcomeModalApi: hoisted.dismiss }))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
beforeEach(() => {
  hoisted.isMobile.mockReturnValue(false)
  hoisted.dismiss.mockResolvedValue(undefined)
})

function renderGate(showWelcomeModal: boolean) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <WelcomeModalGate showWelcomeModal={showWelcomeModal} />
    </QueryClientProvider>,
  )
}

describe('WelcomeModalGate', () => {
  it('renders nothing when not eligible', () => {
    renderGate(false)
    expect(screen.queryByTestId('welcome-modal-title')).toBeNull()
  })

  it('shows the modal when eligible', () => {
    renderGate(true)
    expect(screen.getByTestId('welcome-modal-title')).toBeTruthy()
  })

  it('persists dismissal and hides the modal on Get Started', async () => {
    renderGate(true)
    fireEvent.click(screen.getByTestId('welcome-modal-get-started'))

    await waitFor(() => expect(hoisted.dismiss).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.queryByTestId('welcome-modal-title')).toBeNull())
  })
})
