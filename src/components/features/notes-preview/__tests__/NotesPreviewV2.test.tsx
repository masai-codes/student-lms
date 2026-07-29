// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  useSearch: vi.fn(),
  fetchNotesPreview: vi.fn(),
}))

vi.mock('../notesPreviewRoute', () => ({
  notesPreviewRouteApi: { useSearch: hoisted.useSearch },
}))

vi.mock('@/lib/api/notes-preview/notesPreviewApi', () => ({
  fetchNotesPreviewFromApi: hoisted.fetchNotesPreview,
}))

vi.mock('@/components/shared/markdown-content', () => ({
  MarkdownContent: ({ value }: { value: string }) => (
    <div data-testid="markdown-stub">{value}</div>
  ),
}))

async function renderComponent() {
  const { NotesPreviewV2 } = await import('../NotesPreviewV2')
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <NotesPreviewV2 />
    </QueryClientProvider>,
  )
}

describe('NotesPreviewV2', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the empty state when required params are missing', async () => {
    hoisted.useSearch.mockReturnValue({})
    const { container } = await renderComponent()
    const scope = within(container)

    expect(scope.getByTestId('notes-preview-v2-empty')).toBeTruthy()
    expect(hoisted.fetchNotesPreview).not.toHaveBeenCalled()
  })

  it('shows the loading skeleton while the fetch is pending', async () => {
    hoisted.useSearch.mockReturnValue({
      category: 'lecture',
      contentType: 'notes',
      entityId: '10',
    })
    hoisted.fetchNotesPreview.mockReturnValue(new Promise(() => {}))
    const { container } = await renderComponent()
    const scope = within(container)

    expect(scope.getByTestId('notes-preview-v2-loading')).toBeTruthy()
  })

  it('renders the returned markdown content', async () => {
    hoisted.useSearch.mockReturnValue({
      category: 'lecture',
      contentType: 'notes',
      entityId: '10',
    })
    hoisted.fetchNotesPreview.mockResolvedValueOnce({
      category: 'lecture',
      contentType: 'notes',
      entityId: 10,
      content: '# Lecture notes',
    })
    const { container } = await renderComponent()
    const scope = within(container)

    await waitFor(() => {
      expect(scope.getByTestId('notes-preview-v2-content')).toBeTruthy()
    })
    expect(scope.getByTestId('markdown-stub').textContent).toBe(
      '# Lecture notes',
    )
  })

  it('shows the empty state when the content is null', async () => {
    hoisted.useSearch.mockReturnValue({
      category: 'assignment',
      contentType: 'instructions',
      entityId: '10',
    })
    hoisted.fetchNotesPreview.mockResolvedValueOnce({
      category: 'assignment',
      contentType: 'instructions',
      entityId: 10,
      content: null,
    })
    const { container } = await renderComponent()
    const scope = within(container)

    await waitFor(() => {
      expect(scope.getByTestId('notes-preview-v2-empty')).toBeTruthy()
    })
  })

  it('shows the empty state when the content is blank whitespace', async () => {
    hoisted.useSearch.mockReturnValue({
      category: 'lecture',
      contentType: 'notes',
      entityId: '10',
    })
    hoisted.fetchNotesPreview.mockResolvedValueOnce({
      category: 'lecture',
      contentType: 'notes',
      entityId: 10,
      content: '   ',
    })
    const { container } = await renderComponent()
    const scope = within(container)

    await waitFor(() => {
      expect(scope.getByTestId('notes-preview-v2-empty')).toBeTruthy()
    })
  })

  it('shows the empty state when the fetch fails', async () => {
    hoisted.useSearch.mockReturnValue({
      category: 'lecture',
      contentType: 'notes',
      entityId: '10',
    })
    hoisted.fetchNotesPreview.mockRejectedValueOnce(new Error('UNAUTHORIZED'))
    const { container } = await renderComponent()
    const scope = within(container)

    await waitFor(() => {
      expect(scope.getByTestId('notes-preview-v2-empty')).toBeTruthy()
    })
  })
})
