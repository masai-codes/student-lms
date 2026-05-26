// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { LearnDetailFullWidthBanner } from '../LearnDetailFullWidthBanner'

describe('LearnDetailFullWidthBanner', () => {
  it('renders title and description content', () => {
    render(
      <LearnDetailFullWidthBanner title="Not open yet" testId="detail-banner">
        Unlock at <span>10 May 2026</span>
      </LearnDetailFullWidthBanner>,
    )

    expect(screen.getByTestId('detail-banner')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Not open yet' })).toBeTruthy()
    expect(screen.getByText('Unlock at')).toBeTruthy()
    expect(screen.getByText('10 May 2026')).toBeTruthy()
  })
})
