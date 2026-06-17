// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ChatbotMobileShell } from './ChatbotMobileShell'

vi.mock('@/components/features/chatbot/components/ChatbotMobileDrawer', () => ({
  ChatbotMobileDrawer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mobile-drawer">{children}</div>
  ),
}))

describe('ChatbotMobileShell', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders a full-bleed dock with composer when no session is active', () => {
    render(
      <ChatbotMobileShell
        isDrawerOpen={false}
        onDrawerOpenChange={vi.fn()}
        loadError={null}
        activeSessionId={null}
        optimisticMessages={[]}
        isCreatingSession={false}
        onStartWithText={vi.fn()}
        onStartWithVoice={vi.fn()}
        onInlineSend={vi.fn()}
        drawerContent={<div data-testid="drawer-content" />}
      />,
    )

    expect(screen.getByText('Ask AI about this lecture')).toBeTruthy()
    expect(screen.getByText('AI can make mistakes, so double-check it.')).toBeTruthy()
    expect(screen.getByRole('textbox', { name: 'Ask about the lecture' })).toBeTruthy()
    expect(screen.queryByTestId('mobile-drawer')).toBeNull()
  })

  it('renders inline composer for an active session when the drawer is closed', () => {
    render(
      <ChatbotMobileShell
        isDrawerOpen={false}
        onDrawerOpenChange={vi.fn()}
        loadError={null}
        activeSessionId="session-1"
        optimisticMessages={[]}
        isCreatingSession={false}
        onStartWithText={vi.fn()}
        onStartWithVoice={vi.fn()}
        onInlineSend={vi.fn()}
        drawerContent={<div data-testid="drawer-content" />}
      />,
    )

    expect(screen.getByRole('textbox', { name: 'Ask about the lecture' })).toBeTruthy()
    expect(screen.getByTestId('drawer-content')).toBeTruthy()
  })

  it('opens the drawer when voice is activated from the inline composer', () => {
    const onDrawerOpenChange = vi.fn()

    render(
      <ChatbotMobileShell
        isDrawerOpen={false}
        onDrawerOpenChange={onDrawerOpenChange}
        loadError={null}
        activeSessionId="session-1"
        optimisticMessages={[]}
        isCreatingSession={false}
        onStartWithText={vi.fn()}
        onStartWithVoice={vi.fn()}
        onInlineSend={vi.fn()}
        drawerContent={<div />}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Switch to voice chat' }),
    )

    expect(onDrawerOpenChange).toHaveBeenCalledWith(true)
  })

  it('submits inline text and hides the dock composer when the drawer is open', () => {
    const onInlineSend = vi.fn()

    render(
      <ChatbotMobileShell
        isDrawerOpen={true}
        onDrawerOpenChange={vi.fn()}
        loadError={null}
        activeSessionId="session-1"
        optimisticMessages={[]}
        isCreatingSession={false}
        onStartWithText={vi.fn()}
        onStartWithVoice={vi.fn()}
        onInlineSend={onInlineSend}
        drawerContent={<div data-testid="drawer-content" />}
      />,
    )

    expect(screen.queryByRole('textbox', { name: 'Ask about the lecture' })).toBeNull()
    expect(screen.getByTestId('mobile-drawer')).toBeTruthy()
  })
})
