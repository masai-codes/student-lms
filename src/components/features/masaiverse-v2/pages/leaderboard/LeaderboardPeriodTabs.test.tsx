// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import LeaderboardPeriodTabs from './LeaderboardPeriodTabs'

afterEach(cleanup)

describe('LeaderboardPeriodTabs', () => {
  it('renders both period tabs', () => {
    render(<LeaderboardPeriodTabs value="overall" onChange={() => {}} />)
    expect(screen.getByRole('tab', { name: 'Overall' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'This month' })).toBeTruthy()
  })

  it('reports the selected period on change', () => {
    const onChange = vi.fn()
    render(<LeaderboardPeriodTabs value="overall" onChange={onChange} />)
    // Radix Tabs uses automatic activation, so focusing the tab selects it.
    fireEvent.focus(screen.getByRole('tab', { name: 'This month' }))
    expect(onChange).toHaveBeenCalledWith('month')
  })
})
