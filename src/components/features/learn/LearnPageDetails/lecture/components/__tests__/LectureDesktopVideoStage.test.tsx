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

  it('renders the video full width with the floating launcher, popup closed', () => {
    render(<LectureDesktopVideoStage lectureId={42} video={<div>Video</div>} />)

    expect(screen.getByText('Video')).toBeTruthy()
    expect(screen.getByTestId('lecture-ask-ai-launcher')).toBeTruthy()
    expect(screen.queryByTestId('lecture-ask-ai-popup')).toBeNull()
  })

  it('opens the floating popup when the launcher is clicked', () => {
    render(<LectureDesktopVideoStage lectureId={42} video={<div>Video</div>} />)

    fireEvent.click(screen.getByTestId('lecture-ask-ai-launcher'))

    expect(screen.getByTestId('lecture-ask-ai-popup')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Close assistant' })).toBeTruthy()
  })

  it('restores an open popup from storage', () => {
    window.localStorage.setItem('lecture-split-chat-open', 'true')

    render(<LectureDesktopVideoStage lectureId={42} video={<div>Video</div>} />)

    expect(screen.getByTestId('lecture-ask-ai-popup')).toBeTruthy()
  })
})
