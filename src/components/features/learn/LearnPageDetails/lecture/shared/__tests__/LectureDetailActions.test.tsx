// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LectureDetailActions } from '../LectureDetailActions'

const hoisted = vi.hoisted(() => ({
  add: vi.fn(),
  remove: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('@/lib/api/learn/learnApi', () => ({
  addLectureBookmarkViaApi: hoisted.add,
  removeLectureBookmarkViaApi: hoisted.remove,
}))

vi.mock('@/lib/toast', () => ({
  toast: { success: hoisted.toastSuccess, error: hoisted.toastError },
}))

describe('LectureDetailActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.add.mockResolvedValue({ isBookmarked: true })
    hoisted.remove.mockResolvedValue({ isBookmarked: false })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the Raise Ticket CTA', () => {
    render(<LectureDetailActions lectureId={572} initialIsBookmarked={false} />)
    expect(screen.getByRole('button', { name: 'Raise Ticket' })).toBeTruthy()
  })

  it('adds a bookmark optimistically and shows a success toast', async () => {
    render(<LectureDetailActions lectureId={572} initialIsBookmarked={false} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add bookmark' }))

    expect(screen.getByRole('button', { name: 'Remove bookmark' })).toBeTruthy()
    expect(hoisted.add).toHaveBeenCalledWith(572)

    await waitFor(() =>
      expect(hoisted.toastSuccess).toHaveBeenCalledWith('Bookmark added'),
    )
  })

  it('removes an existing bookmark', async () => {
    render(<LectureDetailActions lectureId={572} initialIsBookmarked={true} />)

    fireEvent.click(screen.getByRole('button', { name: 'Remove bookmark' }))

    expect(hoisted.remove).toHaveBeenCalledWith(572)
    await waitFor(() =>
      expect(hoisted.toastSuccess).toHaveBeenCalledWith('Bookmark removed'),
    )
  })

  it('reverts state and shows an error toast when the request fails', async () => {
    hoisted.add.mockRejectedValueOnce(new Error('network'))
    render(<LectureDetailActions lectureId={572} initialIsBookmarked={false} />)

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
    render(<LectureDetailActions lectureId={572} initialIsBookmarked={false} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add bookmark' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove bookmark' }))

    expect(hoisted.add).toHaveBeenCalledTimes(1)
    resolveAdd({ isBookmarked: true })
    await waitFor(() => expect(hoisted.toastSuccess).toHaveBeenCalledTimes(1))
  })
})
