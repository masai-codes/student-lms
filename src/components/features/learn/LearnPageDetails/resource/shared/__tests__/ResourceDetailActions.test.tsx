// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ResourceDetailActions } from '../ResourceDetailActions'

const hoisted = vi.hoisted(() => ({
  add: vi.fn(),
  remove: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('@/lib/api/learn/learnApi', () => ({
  addResourceBookmarkViaApi: hoisted.add,
  removeResourceBookmarkViaApi: hoisted.remove,
}))

vi.mock('@/lib/toast', () => ({
  toast: { success: hoisted.toastSuccess, error: hoisted.toastError },
}))

describe('ResourceDetailActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.add.mockResolvedValue({ isBookmarked: true })
    hoisted.remove.mockResolvedValue({ isBookmarked: false })
  })

  afterEach(() => {
    cleanup()
  })

  it('adds a bookmark optimistically and shows a success toast', async () => {
    render(<ResourceDetailActions resourceId={515} initialIsBookmarked={false} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add bookmark' }))

    // Optimistic flip happens immediately.
    expect(screen.getByRole('button', { name: 'Remove bookmark' })).toBeTruthy()
    expect(hoisted.add).toHaveBeenCalledWith(515)

    await waitFor(() =>
      expect(hoisted.toastSuccess).toHaveBeenCalledWith('Bookmark added'),
    )
  })

  it('removes an existing bookmark', async () => {
    render(<ResourceDetailActions resourceId={515} initialIsBookmarked={true} />)

    fireEvent.click(screen.getByRole('button', { name: 'Remove bookmark' }))

    expect(hoisted.remove).toHaveBeenCalledWith(515)
    await waitFor(() =>
      expect(hoisted.toastSuccess).toHaveBeenCalledWith('Bookmark removed'),
    )
  })

  it('reverts state and shows an error toast when the request fails', async () => {
    hoisted.add.mockRejectedValueOnce(new Error('network'))
    render(<ResourceDetailActions resourceId={515} initialIsBookmarked={false} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add bookmark' }))

    await waitFor(() =>
      expect(hoisted.toastError).toHaveBeenCalledWith(
        'Could not update bookmark. Please try again.',
      ),
    )
    expect(screen.getByRole('button', { name: 'Add bookmark' })).toBeTruthy()
  })

  it('ignores clicks while a request is pending', async () => {
    let resolveAdd: (value: { isBookmarked: boolean }) => void = () => {}
    hoisted.add.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveAdd = resolve
      }),
    )
    render(<ResourceDetailActions resourceId={515} initialIsBookmarked={false} />)

    const button = screen.getByRole('button', { name: 'Add bookmark' })
    fireEvent.click(button)
    // Second click while pending should be a no-op (button is disabled too).
    fireEvent.click(screen.getByRole('button', { name: 'Remove bookmark' }))

    expect(hoisted.add).toHaveBeenCalledTimes(1)
    resolveAdd({ isBookmarked: true })
    await waitFor(() => expect(hoisted.toastSuccess).toHaveBeenCalledTimes(1))
  })
})
