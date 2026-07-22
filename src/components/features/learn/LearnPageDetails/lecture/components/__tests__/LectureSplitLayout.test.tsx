// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LectureSplitLayout } from '../LectureSplitLayout'

vi.mock('@/components/features/learn/shared/learnAnalytics', () => ({
  pushLearnEvent: vi.fn(),
}))

// The rail renders LectureAiChatExperience — stub it down to a close button so
// these layout tests don't pull in the chat stream/network.
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

// Desktop viewport: the split row + rail only mount at `md+`.
function mockDesktopMatchMedia(matches = true) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

function renderLayout() {
  const client = new QueryClient()
  return render(
    <QueryClientProvider client={client}>
      <LectureSplitLayout lectureId={42}>
        <div>Page content</div>
      </LectureSplitLayout>
    </QueryClientProvider>,
  )
}

describe('LectureSplitLayout', () => {
  beforeEach(() => {
    mockDesktopMatchMedia(true)
  })

  afterEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  it('renders the page as the left section with the chat rail open by default', () => {
    renderLayout()

    expect(screen.getByText('Page content')).toBeTruthy()
    expect(screen.getByTestId('lecture-chat-panel')).toBeTruthy()
    expect(screen.getByTestId('lecture-chat-resize-handle')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Close assistant' })).toBeTruthy()
  })

  it('stays collapsed when the user closed the rail previously', () => {
    vi.useFakeTimers()
    try {
      window.localStorage.setItem('lecture-split-chat-open', 'false')

      renderLayout()

      act(() => {
        vi.advanceTimersByTime(300)
      })
      expect(screen.queryByTestId('lecture-chat-panel')).toBeNull()
      expect(screen.queryByTestId('lecture-chat-resize-handle')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('collapses the rail back to full-width page after the close animation', () => {
    vi.useFakeTimers()
    try {
      renderLayout()

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

  it('does not render the rail on mobile viewports', () => {
    mockDesktopMatchMedia(false)
    renderLayout()

    expect(screen.getByText('Page content')).toBeTruthy()
    expect(screen.queryByTestId('lecture-chat-panel')).toBeNull()
  })
})
