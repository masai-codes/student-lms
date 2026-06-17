// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ChatbotHistoryHeader } from './ChatbotHistoryHeader'

describe('ChatbotHistoryHeader', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders a close control when onCloseSidebar is provided', () => {
    const onCloseSidebar = vi.fn()

    render(
      <ChatbotHistoryHeader
        onOpenHistory={vi.fn()}
        onCloseSidebar={onCloseSidebar}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Ask about the lecture' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Close assistant' }))

    expect(onCloseSidebar).toHaveBeenCalledTimes(1)
  })

  it('hides the close control when onCloseSidebar is omitted', () => {
    render(<ChatbotHistoryHeader onOpenHistory={vi.fn()} />)

    expect(
      screen.queryByRole('button', { name: 'Close assistant' }),
    ).toBeNull()
  })
})
