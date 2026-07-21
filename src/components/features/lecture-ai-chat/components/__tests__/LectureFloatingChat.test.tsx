// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LectureFloatingChat } from '../LectureFloatingChat'

const pushLearnEvent = vi.fn()
vi.mock('@/components/features/learn/shared/learnAnalytics', () => ({
  pushLearnEvent: (...args: Array<unknown>) => pushLearnEvent(...args),
}))

// The chat surface is exercised elsewhere; here we only need to observe the
// props the floating shell wires into it.
vi.mock('../../LectureAiChatExperience', () => ({
  LectureAiChatExperience: ({
    onCloseSidebar,
    isExpanded,
    onToggleExpand,
  }: {
    onCloseSidebar?: () => void
    isExpanded?: boolean
    onToggleExpand?: () => void
  }) => (
    <div data-testid="chat-surface" data-expanded={String(Boolean(isExpanded))}>
      <button type="button" onClick={onCloseSidebar}>
        Close surface
      </button>
      <button type="button" onClick={onToggleExpand}>
        Toggle expand
      </button>
    </div>
  ),
}))

function makeState(isOpen: boolean) {
  return { isOpen, open: vi.fn(), close: vi.fn() }
}

describe('LectureFloatingChat', () => {
  afterEach(() => {
    cleanup()
    pushLearnEvent.mockClear()
  })

  it('shows only the launcher while closed and opens on click', () => {
    const state = makeState(false)
    render(<LectureFloatingChat lectureId={42} state={state} />)

    expect(screen.queryByTestId('lecture-ask-ai-popup')).toBeNull()
    fireEvent.click(screen.getByTestId('lecture-ask-ai-launcher'))

    expect(state.open).toHaveBeenCalledTimes(1)
    expect(pushLearnEvent).toHaveBeenCalledWith('l_learn_lecture_ask_ai_open', {
      lectureId: 42,
    })
  })

  it('renders the popup while open and closes from the surface', () => {
    const state = makeState(true)
    render(<LectureFloatingChat lectureId={7} state={state} />)

    // The launcher stays mounted (so it never re-pops) but is hidden while open.
    const launcher = screen.getByTestId('lecture-ask-ai-launcher')
    expect(launcher.getAttribute('aria-hidden')).toBe('true')
    expect(launcher.className).toContain('opacity-0')
    expect(screen.getByTestId('lecture-ask-ai-popup')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Close surface' }))

    expect(state.close).toHaveBeenCalledTimes(1)
    expect(pushLearnEvent).toHaveBeenCalledWith('l_learn_lecture_ask_ai_close', {
      lectureId: 7,
    })
  })

  it('maximizes and tracks the expand toggle', () => {
    render(<LectureFloatingChat lectureId={9} state={makeState(true)} />)

    expect(screen.getByTestId('chat-surface').dataset.expanded).toBe('false')
    fireEvent.click(screen.getByRole('button', { name: 'Toggle expand' }))

    expect(screen.getByTestId('chat-surface').dataset.expanded).toBe('true')
    expect(pushLearnEvent).toHaveBeenCalledWith(
      'l_learn_lecture_ask_ai_expand_toggle',
      { lectureId: 9, expanded: true },
    )
  })

  it('hides the launcher but still opens the popup when showLauncher is false', () => {
    const { rerender } = render(
      <LectureFloatingChat
        lectureId={4}
        state={makeState(false)}
        showLauncher={false}
      />,
    )

    expect(screen.queryByTestId('lecture-ask-ai-launcher')).toBeNull()

    rerender(
      <LectureFloatingChat
        lectureId={4}
        state={makeState(true)}
        showLauncher={false}
      />,
    )
    expect(screen.getByTestId('lecture-ask-ai-popup')).toBeTruthy()
    expect(screen.queryByTestId('lecture-ask-ai-launcher')).toBeNull()
  })

  it('renders the contained variant inline for the fullscreen video', () => {
    render(
      <LectureFloatingChat
        lectureId={3}
        state={makeState(false)}
        variant="contained"
      />,
    )

    // The contained variant anchors inside the fullscreen video (absolute),
    // not via the body portal — the anchor lives on the wrapper.
    const wrapper = screen.getByTestId('lecture-ask-ai-launcher').closest('div')
    expect(wrapper?.className).toContain('absolute')
  })

  it('grows the contained popup to near-full size when maximized', () => {
    render(
      <LectureFloatingChat
        lectureId={3}
        state={makeState(true)}
        variant="contained"
      />,
    )

    const popup = screen.getByTestId('lecture-ask-ai-popup')
    expect(popup.className).toContain('w-[min(26rem,calc(100%-2rem))]')

    fireEvent.click(screen.getByRole('button', { name: 'Toggle expand' }))

    // Same bottom-right anchor, grown to fill (keeps its rounding for the morph).
    expect(popup.className).toContain('w-[calc(100%-2rem)]')
    expect(popup.className).toContain('h-[calc(100%-2rem)]')
    expect(popup.className).toContain('rounded-2xl')
  })

  it('unmounts the popup after the close transition', () => {
    vi.useFakeTimers()
    try {
      const { rerender } = render(
        <LectureFloatingChat lectureId={5} state={makeState(true)} />,
      )
      expect(screen.getByTestId('lecture-ask-ai-popup')).toBeTruthy()

      rerender(<LectureFloatingChat lectureId={5} state={makeState(false)} />)
      // Still mounted mid-transition, then removed once the timer elapses.
      expect(screen.getByTestId('lecture-ask-ai-popup')).toBeTruthy()
      act(() => {
        vi.advanceTimersByTime(300)
      })
      expect(screen.queryByTestId('lecture-ask-ai-popup')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })
})
