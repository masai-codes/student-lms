// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ContextSubcategoryList } from '../ContextSubcategoryList'

const hoisted = vi.hoisted(() => ({ fetchSubcategories: vi.fn() }))

vi.mock('@/lib/api/support/supportApi', () => ({
  fetchSubcategoriesByCategory: hoisted.fetchSubcategories,
}))

function renderList(onSelect = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <ContextSubcategoryList category="lecture" onSelect={onSelect} />
    </QueryClientProvider>,
  )
  return { onSelect }
}

describe('ContextSubcategoryList', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => cleanup())

  it('lists the category subcategories and reports the selected value', async () => {
    hoisted.fetchSubcategories.mockResolvedValue({
      subcategories: [
        { value: 'video-issue', label: 'Video Issue' },
        { value: 'content-doubt', label: 'Content Doubt' },
      ],
    })
    const { onSelect } = renderList()

    const option = await screen.findByText('Video Issue')
    expect(hoisted.fetchSubcategories).toHaveBeenCalledWith('lecture')
    expect(screen.getByText('Content Doubt')).toBeTruthy()

    fireEvent.click(option)
    expect(onSelect).toHaveBeenCalledWith('video-issue')
  })

  it('falls back to a "General" option when there are no subcategories', async () => {
    hoisted.fetchSubcategories.mockResolvedValue({ subcategories: [] })
    const { onSelect } = renderList()

    const general = await screen.findByText('General')
    fireEvent.click(general)
    expect(onSelect).toHaveBeenCalledWith('General')
  })

  it('shows a loading state before data resolves', async () => {
    hoisted.fetchSubcategories.mockReturnValue(new Promise(() => {}))
    renderList()

    expect(screen.getByText('Loading subcategories…')).toBeTruthy()
    await waitFor(() => expect(hoisted.fetchSubcategories).toHaveBeenCalled())
  })
})
