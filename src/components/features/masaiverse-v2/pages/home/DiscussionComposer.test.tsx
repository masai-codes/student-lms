// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DiscussionComposer from './DiscussionComposer'
import type { ReactNode } from 'react'

const { createDiscussion } = vi.hoisted(() => ({ createDiscussion: vi.fn() }))

vi.mock('@/lib/api/masaiverse-v2/masaiverseV2Api', () => ({
  createMasaiverseV2Discussion: createDiscussion,
}))
// Replace the rich-text editor with a controlled textarea for testing.
vi.mock('@/components/discussion-post-card', async () => {
  const { createElement } = await import('react')
  return {
    RichTextEditor: ({
      value,
      onChange,
    }: {
      value: string
      onChange: (v: string) => void
    }) =>
      createElement('textarea', {
        'aria-label': 'content',
        value,
        onChange: (e: { target: { value: string } }) =>
          onChange(e.target.value),
      }),
  }
})

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('DiscussionComposer', () => {
  it('disables Post until both title and content are filled', () => {
    renderWithClient(<DiscussionComposer onClose={() => {}} />)
    const post = screen.getByText('Post')
    expect(post.hasAttribute('disabled')).toBe(true)

    fireEvent.change(screen.getByPlaceholderText('Discussion title'), {
      target: { value: 'My title' },
    })
    expect(post.hasAttribute('disabled')).toBe(true) // content still empty

    fireEvent.change(screen.getByLabelText('content'), {
      target: { value: 'Hello world' },
    })
    expect(post.hasAttribute('disabled')).toBe(false)
  })

  it('submits title + content and closes on success', async () => {
    createDiscussion.mockResolvedValueOnce({ id: '99' })
    const onClose = vi.fn()
    renderWithClient(<DiscussionComposer onClose={onClose} />)

    fireEvent.change(screen.getByPlaceholderText('Discussion title'), {
      target: { value: '  My title  ' },
    })
    fireEvent.change(screen.getByLabelText('content'), {
      target: { value: 'Hello world' },
    })
    fireEvent.change(
      screen.getByPlaceholderText(
        'Add tags, comma separated (e.g. Career, Interviews)',
      ),
      { target: { value: 'Career, Interviews' } },
    )
    fireEvent.click(screen.getByText('Post'))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(createDiscussion.mock.calls[0][0]).toEqual({
      title: 'My title',
      content: 'Hello world',
      tags: ['Career', 'Interviews'],
    })
  })

  it('shows an error and stays open when the request fails', async () => {
    createDiscussion.mockRejectedValueOnce(new Error('boom'))
    const onClose = vi.fn()
    renderWithClient(<DiscussionComposer onClose={onClose} />)

    fireEvent.change(screen.getByPlaceholderText('Discussion title'), {
      target: { value: 'Title' },
    })
    fireEvent.change(screen.getByLabelText('content'), {
      target: { value: 'Body' },
    })
    fireEvent.click(screen.getByText('Post'))

    await waitFor(() =>
      expect(
        screen.getByText('Could not post your discussion. Please try again.'),
      ).toBeTruthy(),
    )
    expect(onClose).not.toHaveBeenCalled()
  })
})
