// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ShareClubButton from './ShareClubButton'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('ShareClubButton', () => {
  it('copies the current URL and shows a self-dismissing confirmation', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    render(<ShareClubButton />)
    expect(screen.queryByText('Link copied!')).toBeNull()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /share club/i }))
    })

    expect(writeText).toHaveBeenCalledWith(window.location.href)
    expect(screen.getByText('Link copied!')).toBeTruthy()

    await act(async () => {
      vi.advanceTimersByTime(2300)
    })
    expect(screen.queryByText('Link copied!')).toBeNull()
  })

  it('does not show the confirmation when copying fails', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('nope')) },
    })
    // Legacy fallback also fails (execCommand is absent in jsdom).
    Object.assign(document, { execCommand: vi.fn().mockReturnValue(false) })

    render(<ShareClubButton />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /share club/i }))
    })

    expect(screen.queryByText('Link copied!')).toBeNull()
  })
})
