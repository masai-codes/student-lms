// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { LearnContentListSkeleton } from '../LearnContentListSkeleton'

describe('LearnContentListSkeleton', () => {
  afterEach(() => cleanup())

  it('renders the default placeholder cards inside a busy region', () => {
    render(<LearnContentListSkeleton />)
    const region = screen.getByLabelText('Loading items')
    expect(region.getAttribute('aria-busy')).toBe('true')
    expect(region.childElementCount).toBe(6)
  })

  it('respects a custom card count', () => {
    render(<LearnContentListSkeleton count={3} />)
    expect(screen.getByLabelText('Loading items').childElementCount).toBe(3)
  })
})
