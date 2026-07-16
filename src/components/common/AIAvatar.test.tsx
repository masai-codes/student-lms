// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('lottie-react', () => ({
  default: () => <div data-testid="lottie" />,
}))

import { AIAvatar } from './AIAvatar'

describe('AIAvatar', () => {
  afterEach(() => {
    cleanup()
  })

  it('applies the speaking pulse animation when isSpeaking is true', async () => {
    const { container, findByTestId } = render(<AIAvatar isSpeaking />)

    await findByTestId('lottie')

    const pulse = container.querySelector('.animate-ai-avatar-speak')
    expect(pulse).toBeTruthy()
  })

  it('does not apply the speaking pulse animation when idle', async () => {
    const { container, findByTestId } = render(<AIAvatar />)

    await findByTestId('lottie')

    const pulse = container.querySelector('.animate-ai-avatar-speak')
    expect(pulse).toBeNull()
  })
})
