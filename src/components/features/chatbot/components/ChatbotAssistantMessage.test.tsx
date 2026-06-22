// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ChatbotAssistantMessage } from './ChatbotAssistantMessage'

describe('ChatbotAssistantMessage', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders nothing for blank content', () => {
    const { container } = render(<ChatbotAssistantMessage content="   " />)
    expect(container.firstChild).toBeNull()
  })

  it('renders plain text in the assistant bubble', () => {
    render(<ChatbotAssistantMessage content="Hello from the tutor." />)
    expect(screen.getByText('Hello from the tutor.')).toBeTruthy()
  })

  it('renders markdown bold and bullet lists', () => {
    render(
      <ChatbotAssistantMessage
        content={'**Key idea**: tokens are the building blocks.\n\n- First point\n- Second point'}
      />,
    )

    expect(screen.getByText('Key idea').tagName).toBe('STRONG')
    expect(screen.getByText(/tokens are the building blocks/)).toBeTruthy()
    expect(screen.getByText('First point')).toBeTruthy()
    expect(screen.getByText('Second point')).toBeTruthy()
  })

  it('applies assistant bubble styling', () => {
    const { container } = render(<ChatbotAssistantMessage content="Styled reply" />)
    const bubble = container.firstChild as HTMLElement
    expect(bubble.className).toContain('text-gray-900')
    expect(bubble.className).toContain('w-full')
    expect(bubble.className).toContain('self-stretch')
    expect(bubble.className).toContain('text-gray-900')
  })
})
