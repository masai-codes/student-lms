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

  it('keeps the CTA enabled and shows a red error when required fields are empty', () => {
    const { scope, onSubmit } = setup()
    const submit = scope.getByRole('button', { name: /post discussion/i })
    // CTA is never gated by field content anymore.
    expect((submit as HTMLButtonElement).disabled).toBe(false)
    expect(scope.queryByTestId('lecture-discussion-create-error')).toBeNull()

    fireEvent.submit(scope.getByTestId('lecture-discussion-create-form'))

    expect(onSubmit).not.toHaveBeenCalled()
    const alert = scope.getByTestId('lecture-discussion-create-error')
    expect(alert.getAttribute('role')).toBe('alert')
    expect(alert.textContent).toContain('title')
    // The title error focuses the title input so the caret lands there.
    const titleInput = scope.getByTestId('lecture-discussion-title-input')
    expect(document.activeElement).toBe(titleInput)

    // Title present but description still empty -> description error.
    fireEvent.change(scope.getByTestId('lecture-discussion-title-input'), {
      target: { value: 'My question' },
    })
    fireEvent.submit(scope.getByTestId('lecture-discussion-create-form'))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(
      scope.getByTestId('lecture-discussion-create-error').textContent,
    ).toContain('description')
  })

  it('clears the error once the user edits a field', () => {
    const { scope } = setup()
    fireEvent.submit(scope.getByTestId('lecture-discussion-create-form'))
    expect(scope.getByTestId('lecture-discussion-create-error')).toBeTruthy()

    fireEvent.change(scope.getByTestId('lecture-discussion-title-input'), {
      target: { value: 'A' },
    })
    expect(scope.queryByTestId('lecture-discussion-create-error')).toBeNull()
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
