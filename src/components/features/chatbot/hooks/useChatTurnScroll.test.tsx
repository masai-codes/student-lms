// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ChatbotUserMessage } from '@/components/features/chatbot/components/ChatbotUserMessage'
import { useChatTurnScroll } from '@/components/features/chatbot/hooks/useChatTurnScroll'
import type { DisplayMessage } from '@/components/features/chatbot/types'

type ResizeObserverCallback = (entries: ReadonlyArray<unknown>) => void

class StubResizeObserver {
  static instances: Array<StubResizeObserver> = []
  callback: ResizeObserverCallback

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    StubResizeObserver.instances.push(this)
  }

  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()

  trigger() {
    this.callback([])
  }
}

function flushObserver() {
  act(() => {
    StubResizeObserver.instances.forEach((instance) => instance.trigger())
  })
}

function TestHarness({ messages }: { messages: DisplayMessage[] }) {
  const {
    scrollContainerRef,
    spacerHeightPx,
    userMessageMaxHeightPx,
    latestUserMessageId,
  } = useChatTurnScroll(messages)

  return (
    <div
      ref={scrollContainerRef}
      data-testid="scroll-container"
      style={{ height: 400, overflow: 'auto' }}
    >
      {messages.map((message) =>
        message.role === 'user' ? (
          <ChatbotUserMessage
            key={message.id}
            message={message}
            maxHeightPx={userMessageMaxHeightPx}
            isLatest={message.id === latestUserMessageId}
          />
        ) : (
          <div key={message.id}>{message.content}</div>
        ),
      )}
      <div data-testid="spacer" style={{ minHeight: spacerHeightPx }} />
    </div>
  )
}

function mockContainerAndUserRects(
  container: HTMLElement,
  messageId: string,
  options: { containerTop: number; messageTop: number; scrollTop?: number },
) {
  const userMessage = container.querySelector(
    `[data-chat-user-message-id="${messageId}"]`,
  ) as HTMLElement

  Object.defineProperty(container, 'clientHeight', { configurable: true, value: 400 })
  Object.defineProperty(container, 'scrollTop', {
    configurable: true,
    writable: true,
    value: options.scrollTop ?? 0,
  })
  container.getBoundingClientRect = () => ({ top: options.containerTop }) as DOMRect
  userMessage.getBoundingClientRect = () => ({ top: options.messageTop }) as DOMRect
}

describe('useChatTurnScroll', () => {
  const scrollTo = vi.fn()
  let originalGetBoundingClientRect: typeof HTMLElement.prototype.getBoundingClientRect

  beforeEach(() => {
    StubResizeObserver.instances = []
    vi.stubGlobal('ResizeObserver', StubResizeObserver)
    scrollTo.mockReset()
    HTMLElement.prototype.scrollTo = scrollTo
    originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
  })

  afterEach(() => {
    cleanup()
    HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
    vi.unstubAllGlobals()
  })

  it('snaps the latest user message instantly on first render', () => {
    const messages: DisplayMessage[] = [
      { id: 'user-1', role: 'user', content: 'Hello' },
      { id: 'assistant-1', role: 'assistant', content: 'Hi' },
    ]

    render(<TestHarness messages={messages} />)

    const container = screen.getByTestId('scroll-container')
    mockContainerAndUserRects(container, 'user-1', {
      containerTop: 100,
      messageTop: 180,
      scrollTop: 50,
    })

    flushObserver()

    expect(scrollTo).toHaveBeenCalledWith({ top: 130, behavior: 'instant' })
    expect(screen.getByTestId('spacer').style.minHeight).toBe('280px')
  })

  it('smoothly scrolls when a newer user message is added', () => {
    const initialMessages: DisplayMessage[] = [
      { id: 'user-1', role: 'user', content: 'Hello' },
      { id: 'assistant-1', role: 'assistant', content: 'Hi' },
    ]

    const { rerender } = render(<TestHarness messages={initialMessages} />)
    const container = screen.getByTestId('scroll-container')

    mockContainerAndUserRects(container, 'user-1', {
      containerTop: 100,
      messageTop: 180,
    })
    flushObserver()
    scrollTo.mockClear()

    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect(
      this: HTMLElement,
    ) {
      const messageId = this.getAttribute('data-chat-user-message-id')
      if (messageId === 'user-2') {
        return { top: 220 } as DOMRect
      }
      if (this.dataset.testid === 'scroll-container') {
        return { top: 100 } as DOMRect
      }
      return originalGetBoundingClientRect.call(this)
    }

    rerender(
      <TestHarness
        messages={[
          ...initialMessages,
          { id: 'user-2', role: 'user', content: 'Follow up' },
        ]}
      />,
    )

    flushObserver()

    expect(scrollTo).toHaveBeenCalledWith({ top: 120, behavior: 'smooth' })
  })

  it('does not scroll when only assistant messages change', () => {
    const messages: DisplayMessage[] = [{ id: 'user-1', role: 'user', content: 'Hello' }]

    const { rerender } = render(<TestHarness messages={messages} />)
    const container = screen.getByTestId('scroll-container')

    mockContainerAndUserRects(container, 'user-1', {
      containerTop: 100,
      messageTop: 160,
    })

    flushObserver()
    scrollTo.mockClear()

    rerender(
      <TestHarness
        messages={[
          ...messages,
          { id: 'assistant-1', role: 'assistant', content: 'Streaming reply' },
        ]}
      />,
    )

    flushObserver()

    expect(scrollTo).not.toHaveBeenCalled()
  })
})
