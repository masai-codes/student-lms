// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LearnControlsSection } from '../LearnControlsSection'
import type { LearnModalFiltersState } from '../../shared/types'

// The filters drawer pulls in heavy UI; it stays closed in these tests.
vi.mock('../filters-modal/LearnFiltersPanel', () => ({
  LearnFiltersPanel: () => null,
}))
vi.mock('@/components/ui/masai-drawer', () => ({ MasaiDrawer: () => null }))

const EMPTY_FILTERS: LearnModalFiltersState = {
  modules: [],
  categories: [],
  types: [],
  priorities: [],
  instructors: [],
  scheduleStartDate: null,
  scheduleEndDate: null,
  schedulePhase: 'all',
  attendanceStatus: null,
  assignmentProgress: 'all',
}

function renderControls(
  overrides: Partial<{
    onSearchChange: (v: string) => void
    searchValue: string
  }> = {},
) {
  const onSearchChange = overrides.onSearchChange ?? vi.fn()
  render(
    <LearnControlsSection
      activeTab="lectures"
      filterCount={0}
      onTabChange={() => {}}
      searchValue={overrides.searchValue ?? ''}
      onSearchChange={onSearchChange}
      moduleFilterOptions={[]}
      categoryFilterOptions={[]}
      typeFilterOptions={[]}
      instructorFilterOptions={[]}
      modalFilters={EMPTY_FILTERS}
      onModulesChange={() => {}}
      onApplyModalFilters={() => {}}
      horizon="today"
      onHorizonChange={() => {}}
    />,
  )
  return { onSearchChange }
}

describe('LearnControlsSection — debounced search', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    cleanup()
  })

  it('reflects typing immediately without committing on every keystroke', () => {
    const { onSearchChange } = renderControls()
    const input = screen.getByPlaceholderText('Search lectures')

    fireEvent.change(input, { target: { value: 'rea' } })
    fireEvent.change(input, { target: { value: 'react' } })

    // Local state reflects the typed value instantly...
    expect(screen.getByDisplayValue('react')).toBeTruthy()
    // ...without committing to the URL on every keystroke.
    expect(onSearchChange).not.toHaveBeenCalled()
  })

  it('commits the latest value once after the debounce window', () => {
    const { onSearchChange } = renderControls()
    const input = screen.getByPlaceholderText('Search lectures')

    fireEvent.change(input, { target: { value: 'rea' } })
    fireEvent.change(input, { target: { value: 'react' } })
    vi.runOnlyPendingTimers() // flush the debounce regardless of its configured length

    expect(onSearchChange).toHaveBeenCalledTimes(1)
    expect(onSearchChange).toHaveBeenCalledWith('react')
  })

  it('supports clearing (backspace to empty) and commits the empty term', () => {
    const { onSearchChange } = renderControls({ searchValue: 'react' })
    const input = screen.getByPlaceholderText('Search lectures')

    fireEvent.change(input, { target: { value: '' } })
    expect(screen.getByDisplayValue('')).toBeTruthy()

    vi.runOnlyPendingTimers()
    expect(onSearchChange).toHaveBeenCalledWith('')
  })
})
