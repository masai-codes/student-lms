// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LectureDesktopVideoStage } from '../LectureDesktopVideoStage'

vi.mock('@/components/features/learn/shared/learnAnalytics', () => ({
  pushLearnEvent: vi.fn(),
}))

vi.mock(
  '@/components/features/lecture-ai-chat/LectureAiChatExperience',
  () => ({
    LectureAiChatExperience: ({
      onCloseSidebar,
    }: {
      onCloseSidebar?: () => void
    }) => (
      <button type="button" onClick={onCloseSidebar}>
        Close assistant
      </button>
    ),
  }),
)

describe('LectureDesktopVideoStage', () => {
  afterEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  it('opens the resizable chat split by default', () => {
    render(<LectureDesktopVideoStage lectureId={42} video={<div>Video</div>} />)

    expect(screen.getByText('Video')).toBeTruthy()
    expect(screen.getByTestId('lecture-chat-panel')).toBeTruthy()
    expect(screen.getByTestId('lecture-chat-resize-handle')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Close assistant' })).toBeTruthy()
  })

  it('stays collapsed when the user closed it previously', () => {
    vi.useFakeTimers()
    try {
      window.localStorage.setItem('lecture-split-chat-open', 'false')

      render(
        <LectureDesktopVideoStage lectureId={42} video={<div>Video</div>} />,
      )

      // The stored "closed" preference is applied on mount, collapsing it.
      act(() => {
        vi.advanceTimersByTime(300)
      })
      expect(screen.queryByTestId('lecture-chat-panel')).toBeNull()
      expect(screen.queryByTestId('lecture-chat-resize-handle')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('collapses the split back to full-width video after the close animation', () => {
    vi.useFakeTimers()
    try {
      render(
        <LectureDesktopVideoStage lectureId={42} video={<div>Video</div>} />,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Close assistant' }))
      // Still mounted through the close transition, then unmounted.
      expect(screen.getByTestId('lecture-chat-panel')).toBeTruthy()
      act(() => {
        vi.advanceTimersByTime(300)
      })
      expect(screen.queryByTestId('lecture-chat-panel')).toBeNull()
      expect(screen.queryByTestId('lecture-chat-resize-handle')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })
})
