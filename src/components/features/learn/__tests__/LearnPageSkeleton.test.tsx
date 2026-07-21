// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { LearnPageSkeleton } from '../LearnPageSkeleton'

describe('LearnPageSkeleton', () => {
  afterEach(() => cleanup())

  it('renders the page chrome placeholders with the list skeleton', () => {
    render(<LearnPageSkeleton />)
    // The list portion reuses the same busy region as the in-page skeleton.
    expect(screen.getByLabelText('Loading items')).toBeTruthy()
  })
})
