// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BookmarksAppliedFilters } from './BookmarksAppliedFilters'
import { createEmptyBookmarkFilters } from './bookmarksFilterConfig'

afterEach(cleanup)

const withValues = {
  ...createEmptyBookmarkFilters(),
  categories: ['DSA'],
  types: ['resource'],
}

describe('BookmarksAppliedFilters', () => {
  it('renders nothing when there are no active filters', () => {
    const { container } = render(
      <BookmarksAppliedFilters
        filters={createEmptyBookmarkFilters()}
        onChange={vi.fn()}
        onClearAll={vi.fn()}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders a chip per value and removes one on click', () => {
    const onChange = vi.fn()
    render(
      <BookmarksAppliedFilters
        filters={withValues}
        onChange={onChange}
        onClearAll={vi.fn()}
      />,
    )
    expect(screen.getByText('DSA')).toBeTruthy()
    expect(screen.getByText('Resource')).toBeTruthy()

    fireEvent.click(screen.getByTestId('bookmarks-chip-categories:DSA'))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ categories: [], types: ['resource'] }),
    )
  })

  it('fires onClearAll from the clear-all button', () => {
    const onClearAll = vi.fn()
    render(
      <BookmarksAppliedFilters
        filters={withValues}
        onChange={vi.fn()}
        onClearAll={onClearAll}
      />,
    )
    fireEvent.click(screen.getByTestId('bookmarks-clear-all'))
    expect(onClearAll).toHaveBeenCalledOnce()
  })
})
