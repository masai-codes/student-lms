// @vitest-environment jsdom
import { fireEvent, render, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LectureDiscussionCreateForm } from '../LectureDiscussionCreateForm'

// Mock the tiptap-backed editor with a plain textarea so the test stays
// deterministic and free of async editor mounting.
vi.mock('@/components/discussion-post-card/rich-text-editor', () => ({
  RichTextEditor: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string
    onChange: (v: string) => void
    placeholder?: string
  }) => (
    <textarea
      data-testid="mock-rich-editor"
      aria-label={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))

describe('LectureDiscussionCreateForm', () => {
  beforeEach(() => vi.clearAllMocks())

  const setup = (props?: Partial<Parameters<typeof LectureDiscussionCreateForm>[0]>) => {
    const onSubmit = vi.fn()
    const utils = render(
      <LectureDiscussionCreateForm onSubmit={onSubmit} {...props} />,
    )
    const scope = within(utils.container)
    return { onSubmit, scope, ...utils }
  }

  it('renders a single merged composer with title and description fields', () => {
    const { scope } = setup()
    expect(scope.getByTestId('lecture-discussion-create-form')).toBeTruthy()
    expect(scope.getByTestId('lecture-discussion-title-input')).toBeTruthy()
    expect(scope.getByTestId('mock-rich-editor')).toBeTruthy()
    expect(scope.getByTestId('lecture-discussion-char-count').textContent).toBe(
      '0/2000',
    )
  })

  it('keeps submit disabled until both title and description have content', () => {
    const { scope } = setup()
    const submit = scope.getByRole('button', { name: /post discussion/i })
    expect((submit as HTMLButtonElement).disabled).toBe(true)

    fireEvent.change(scope.getByTestId('lecture-discussion-title-input'), {
      target: { value: 'My question' },
    })
    expect((submit as HTMLButtonElement).disabled).toBe(true)

    fireEvent.change(scope.getByTestId('mock-rich-editor'), {
      target: { value: '<p>Body text</p>' },
    })
    expect((submit as HTMLButtonElement).disabled).toBe(false)
  })

  it('submits trimmed values and resets the fields', async () => {
    const { scope, onSubmit } = setup()
    const title: HTMLInputElement = scope.getByTestId(
      'lecture-discussion-title-input',
    )
    const editor: HTMLTextAreaElement = scope.getByTestId('mock-rich-editor')

    fireEvent.change(title, { target: { value: '  Trimmed title  ' } })
    fireEvent.change(editor, { target: { value: '<p>Details</p>' } })
    fireEvent.submit(scope.getByTestId('lecture-discussion-create-form'))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Trimmed title',
        descriptionMarkdown: '<p>Details</p>',
      }),
    )
    expect(title.value).toBe('')
    expect(editor.value).toBe('')
  })

  it('does not submit when disabled', () => {
    const { scope, onSubmit } = setup({ disabled: true })
    fireEvent.change(scope.getByTestId('lecture-discussion-title-input'), {
      target: { value: 'Title' },
    })
    fireEvent.change(scope.getByTestId('mock-rich-editor'), {
      target: { value: '<p>Body</p>' },
    })
    fireEvent.submit(scope.getByTestId('lecture-discussion-create-form'))
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
