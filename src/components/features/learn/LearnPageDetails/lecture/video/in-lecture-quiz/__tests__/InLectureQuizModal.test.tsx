// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { InLectureQuizModal } from '../InLectureQuizModal'
import type { NormalizedInLectureQuiz } from '../normalizeInLectureQuizzes'

const hoisted = vi.hoisted(() => ({
  generateUrl: vi.fn(),
  checkGraded: vi.fn(),
}))

vi.mock('@/lib/api/learn/inLectureQuizApi', () => ({
  generateInLectureQuizUrl: hoisted.generateUrl,
  checkInLectureQuizGraded: hoisted.checkGraded,
}))

const QUIZ: NormalizedInLectureQuiz = {
  id: '1',
  assessmentId: 'assessment-a',
  startSec: 10,
  endSec: 60,
}

function renderModal(onSkipToLecture = vi.fn()) {
  render(
    <InLectureQuizModal
      lectureId={572}
      quiz={QUIZ}
      isFullscreen={false}
      onSkipToLecture={onSkipToLecture}
    />,
  )
  return onSkipToLecture
}

/** jsdom defaults to 1024; drop below `md` (768) to get the phone sheet. */
function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    configurable: true,
    writable: true,
  })
}

describe('InLectureQuizModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setViewportWidth(1024)
    hoisted.checkGraded.mockResolvedValue({ graded: false })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the floating panel on tablets and up', async () => {
    // 768 is the narrowest non-phone width — a tablet still gets the popup.
    setViewportWidth(768)
    hoisted.generateUrl.mockResolvedValue({
      url: 'https://assess.example.com/t/1',
      alreadySubmitted: false,
    })
    renderModal()

    const surface = await screen.findByTestId('in-lecture-quiz-modal')
    // The draggable popup, not a vaul sheet — and no close affordance, since
    // the panel collapses to its header instead of dismissing.
    expect(surface.hasAttribute('data-vaul-drawer')).toBe(false)
    expect(surface.getAttribute('aria-label')).toBe('In-lecture quiz')
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Minimize' })).toBeTruthy()
  })

  it('renders a bottom sheet on phones, collapsing to a pill', async () => {
    setViewportWidth(390)
    hoisted.generateUrl.mockResolvedValue({
      url: 'https://assess.example.com/t/1',
      alreadySubmitted: false,
    })
    renderModal()

    const sheet = await screen.findByTestId('in-lecture-quiz-modal')
    expect(sheet.hasAttribute('data-vaul-drawer')).toBe(true)
    // Minimize, never close — the popup has no dismiss on either surface.
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()

    screen.getByRole('button', { name: 'Minimize' }).click()

    const pill = await screen.findByRole('button', { name: 'Restore' })
    expect(pill.getAttribute('data-testid')).toBe('in-lecture-quiz-modal')
    expect(pill.textContent).toContain('Test your knowledge')
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Minimize' })).toBeNull(),
    )

    // And back again.
    pill.click()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Minimize' })).toBeTruthy(),
    )
  })

  it('renders no Continue action — skipping is automatic now', async () => {
    hoisted.generateUrl.mockResolvedValue({
      url: 'https://assess.example.com/t/1',
      alreadySubmitted: false,
    })
    renderModal()

    await waitFor(() => expect(hoisted.checkGraded).toHaveBeenCalled())
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull()
  })

  it('stays put while the attempt is ungraded', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      hoisted.generateUrl.mockResolvedValue({
        url: 'https://assess.example.com/t/1',
        alreadySubmitted: false,
      })
      const onSkipToLecture = renderModal()

      await waitFor(() => expect(hoisted.checkGraded).toHaveBeenCalled())
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10_000)
      })
      expect(onSkipToLecture).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('skips past the quiz window as soon as the attempt is graded', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      hoisted.generateUrl.mockResolvedValue({
        url: 'https://assess.example.com/t/1',
        alreadySubmitted: false,
      })
      hoisted.checkGraded.mockResolvedValue({ graded: true })
      const onSkipToLecture = renderModal()

      // No timer in between — the first poll that sees `graded` skips.
      await waitFor(() => expect(onSkipToLecture).toHaveBeenCalledTimes(1))

      // Later poll ticks must not fire a second skip.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10_000)
      })
      expect(onSkipToLecture).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('never polls or auto-skips an already-submitted quiz', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      hoisted.generateUrl.mockResolvedValue({
        url: 'https://assess.example.com/t/1/review',
        alreadySubmitted: true,
      })
      const onSkipToLecture = renderModal()

      await waitFor(() => expect(hoisted.generateUrl).toHaveBeenCalled())
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10_000)
      })
      expect(hoisted.checkGraded).not.toHaveBeenCalled()
      expect(onSkipToLecture).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })
})
