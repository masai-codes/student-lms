// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LectureDesktopChatSidebar } from '../LectureDesktopChatSidebar'

vi.mock('@/components/features/chatbot/ChatbotExperience', () => ({
  ChatbotExperience: ({
    onCloseSidebar,
  }: {
    onCloseSidebar?: () => void
  }) => (
    <div>
      <button type="button" onClick={onCloseSidebar}>
        Close assistant
      </button>
    </div>
  ),
}))

describe('LectureDesktopChatSidebar', () => {
  afterEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  it('starts collapsed without the sidebar', () => {
    render(
      <LectureDesktopChatSidebar lectureId={42} video={<div>Video</div>} />,
    )

    expect(screen.queryByRole('button', { name: 'Close assistant' })).toBeNull()
    expect(screen.getByText('Video')).toBeTruthy()
  })

  it('restores an open sidebar from storage', () => {
    window.localStorage.setItem('lecture-split-chat-open', 'true')

    render(
      <LectureDesktopChatSidebar lectureId={42} video={<div>Video</div>} />,
    )

    expect(screen.getByRole('button', { name: 'Close assistant' })).toBeTruthy()
  })

  it('collapses when the sidebar is closed', () => {
    window.localStorage.setItem('lecture-split-chat-open', 'true')

    render(
      <LectureDesktopChatSidebar lectureId={42} video={<div>Video</div>} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Close assistant' }))

    expect(screen.queryByRole('button', { name: 'Close assistant' })).toBeNull()
  })
})
