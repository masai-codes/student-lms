// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WelcomeModal } from './WelcomeModal'

const hoisted = vi.hoisted(() => {
  const create = vi.fn(() => Object.assign(vi.fn(), { reset: vi.fn() }))
  return { isMobile: vi.fn(), confetti: Object.assign(vi.fn(), { create }) }
})

vi.mock('canvas-confetti', () => ({ default: hoisted.confetti }))
vi.mock('@/components/features/chatbot/hooks/useIsMobileViewport', () => ({
  useIsMobileViewport: () => hoisted.isMobile(),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
beforeEach(() => {
  hoisted.isMobile.mockReturnValue(false)
})

describe('WelcomeModal', () => {
  it('renders the title, intro copy, video, and CTA on desktop', () => {
    render(<WelcomeModal open onDismiss={vi.fn()} />)
    expect(screen.getByTestId('welcome-modal-title').textContent).toBe('Welcome to Masai!')
    expect(screen.getByTestId('welcome-modal-body-text')).toBeTruthy()
    expect(screen.getByTestId('welcome-modal-video')).toBeTruthy()
    expect(screen.getByTestId('welcome-modal-get-started')).toBeTruthy()
  })

  it('calls onDismiss when Get Started is clicked', () => {
    const onDismiss = vi.fn()
    render(<WelcomeModal open onDismiss={onDismiss} />)
    fireEvent.click(screen.getByTestId('welcome-modal-get-started'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('disables the CTA and shows a pending label while dismissing', () => {
    render(<WelcomeModal open onDismiss={vi.fn()} isDismissing />)
    const cta = screen.getByTestId<HTMLButtonElement>('welcome-modal-get-started')
    expect(cta.disabled).toBe(true)
    expect(cta.textContent).toContain('moment')
  })

  it('renders the body content in the mobile bottom drawer', () => {
    hoisted.isMobile.mockReturnValue(true)
    render(<WelcomeModal open onDismiss={vi.fn()} />)
    expect(screen.getByTestId('welcome-modal-body')).toBeTruthy()
    expect(screen.getByTestId('welcome-modal-get-started')).toBeTruthy()
  })
})
