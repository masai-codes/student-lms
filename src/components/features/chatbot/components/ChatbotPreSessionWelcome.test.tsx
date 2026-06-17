// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ChatbotPreSessionWelcome } from './ChatbotPreSessionWelcome'

describe('ChatbotPreSessionWelcome', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders lecture greeting, disclaimer, and suggested prompts', () => {
    render(
      <ChatbotPreSessionWelcome
        onPromptSelect={vi.fn()}
        composer={<div data-testid="composer" />}
      />,
    )

    expect(
      screen.getByText(/Have questions about this lecture/i),
    ).toBeTruthy()
    expect(screen.getByText('Not sure what to ask? Choose something:')).toBeTruthy()
    expect(screen.getByText('AI can make mistakes, so double-check it.')).toBeTruthy()
    expect(screen.getByText('Summarize the key points')).toBeTruthy()
    expect(screen.getByTestId('composer')).toBeTruthy()
  })

  it('forwards prompt selection when a suggestion is clicked', () => {
    const onPromptSelect = vi.fn()

    render(
      <ChatbotPreSessionWelcome
        onPromptSelect={onPromptSelect}
        composer={<div />}
      />,
    )

    fireEvent.click(screen.getByText('Quiz me on this lecture'))

    expect(onPromptSelect).toHaveBeenCalledWith(
      'Quiz me on what was covered in this lecture with a few short questions.',
    )
  })

  it('disables prompt buttons while prompts are disabled', () => {
    render(
      <ChatbotPreSessionWelcome
        onPromptSelect={vi.fn()}
        promptsDisabled
        composer={<div />}
      />,
    )

    const summarizeButton = screen.getByText('Summarize the key points').closest('button')
    expect(summarizeButton?.hasAttribute('disabled')).toBe(true)
  })
})
