// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
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

  it('renders the video full width with the chat split closed', () => {
    render(<LectureDesktopVideoStage lectureId={42} video={<div>Video</div>} />)

    expect(screen.getByText('Video')).toBeTruthy()
    expect(screen.queryByTestId('lecture-chat-panel')).toBeNull()
    expect(screen.queryByTestId('lecture-chat-resize-handle')).toBeNull()
  })

  it('shows the resizable chat panel when open from storage', () => {
    window.localStorage.setItem('lecture-split-chat-open', 'true')

    render(<LectureDesktopVideoStage lectureId={42} video={<div>Video</div>} />)

    expect(screen.getByTestId('lecture-chat-panel')).toBeTruthy()
    expect(screen.getByTestId('lecture-chat-resize-handle')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Close assistant' })).toBeTruthy()
  })

  it('collapses the split back to full-width video when closed', () => {
    window.localStorage.setItem('lecture-split-chat-open', 'true')

    render(<LectureDesktopVideoStage lectureId={42} video={<div>Video</div>} />)

    fireEvent.click(screen.getByRole('button', { name: 'Close assistant' }))

    expect(screen.queryByTestId('lecture-chat-panel')).toBeNull()
    expect(screen.queryByTestId('lecture-chat-resize-handle')).toBeNull()
  })
})
