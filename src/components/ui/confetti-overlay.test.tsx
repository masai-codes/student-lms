// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConfettiOverlay } from './confetti-overlay'

const hoisted = vi.hoisted(() => {
  const fire = vi.fn()
  const instance = Object.assign(fire, { reset: vi.fn() })
  const create = vi.fn(() => instance)
  return { fire, create, confetti: Object.assign(vi.fn(), { create }) }
})

vi.mock('canvas-confetti', () => ({ default: hoisted.confetti }))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

describe('ConfettiOverlay', () => {
  it('does not fire while inactive', () => {
    render(<ConfettiOverlay active={false} data-testid="confetti" />)
    expect(screen.getByTestId('confetti')).toBeTruthy()
    expect(hoisted.create).not.toHaveBeenCalled()
  })

  it('fires bursts on the bound canvas while active', () => {
    // requestAnimationFrame runs a single frame synchronously so the burst fires.
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0)
      return 1
    })
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {})

    render(<ConfettiOverlay active durationMs={1} data-testid="confetti" />)

    expect(hoisted.create).toHaveBeenCalledTimes(1)
    expect(hoisted.fire).toHaveBeenCalled()
  })
})
