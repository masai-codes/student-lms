// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LectureVideoAskAiPill } from '../LectureVideoAskAiPill'

describe('LectureVideoAskAiPill', () => {
  afterEach(() => {
    cleanup()
  })

  it('opens the assistant when the pill is clicked', () => {
    const onClick = vi.fn()

    render(<LectureVideoAskAiPill onClick={onClick} />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Open lecture AI assistant' }),
    )

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Ask')).toBeTruthy()
  })
})
