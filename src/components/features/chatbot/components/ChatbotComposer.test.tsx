// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ChatbotComposer } from './ChatbotComposer'

function renderComposer(overrides: Partial<Parameters<typeof ChatbotComposer>[0]> = {}) {
  const onChange = vi.fn()
  const onSubmit = vi.fn()

  render(
    <ChatbotComposer
      value=""
      onChange={onChange}
      onSubmit={onSubmit}
      {...overrides}
    />,
  )

  return { onChange, onSubmit }
}

describe('ChatbotComposer', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders a textarea for multiline input', () => {
    renderComposer()

    expect(screen.getByRole('textbox', { name: 'Ask about the lecture' }).tagName).toBe(
      'TEXTAREA',
    )
  })

  it('submits on Enter without Shift', () => {
    const { onSubmit } = renderComposer({ value: 'Hello' })
    const textarea = screen.getByRole('textbox', { name: 'Ask about the lecture' })

    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('does not submit on Shift+Enter', () => {
    const { onSubmit } = renderComposer({ value: 'Hello' })
    const textarea = screen.getByRole('textbox', { name: 'Ask about the lecture' })

    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('does not submit Enter when disabled', () => {
    const { onSubmit } = renderComposer({ value: 'Hello', disabled: true })
    const textarea = screen.getByRole('textbox', { name: 'Ask about the lecture' })

    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
