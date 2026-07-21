// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LearnAppliedFilters } from '../LearnAppliedFilters'
import { createEmptyLearnModalFilters } from '../../shared/types'

afterEach(() => cleanup())

describe('LearnAppliedFilters', () => {
  it('renders nothing when no filters are applied', () => {
    const { container } = render(
      <LearnAppliedFilters
        filters={createEmptyLearnModalFilters()}
        onChange={() => {}}
        onClearAll={() => {}}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders a removable chip per applied filter and removes one on click', () => {
    const onChange = vi.fn()
    render(
      <LearnAppliedFilters
        filters={{
          ...createEmptyLearnModalFilters(),
          modules: ['React', 'Node'],
        }}
        onChange={onChange}
        onClearAll={() => {}}
      />,
    )

    expect(screen.getByText('React')).toBeTruthy()
    expect(screen.getByText('Node')).toBeTruthy()

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove filter: React' }),
    )
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0].modules).toEqual(['Node'])
  })

  it('clears everything via "Clear all"', () => {
    const onClearAll = vi.fn()
    render(
      <LearnAppliedFilters
        filters={{ ...createEmptyLearnModalFilters(), categories: ['coding'] }}
        onChange={() => {}}
        onClearAll={onClearAll}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(onClearAll).toHaveBeenCalledTimes(1)
  })
})
