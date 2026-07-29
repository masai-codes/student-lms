/**
 * Markdown formatting helpers for the plain `<textarea>` in `ChatComposer`.
 *
 * Messages are rendered through `SupportMarkdown` (remark-gfm + rehype-raw),
 * so plain markdown syntax is exactly what needs to land in the textarea.
 * Each helper edits `value` around the current selection and returns where the
 * caller should place the new selection/cursor, so the toolbar behaves like a
 * standard rich-text composer (GitHub/Slack-style) while staying a single
 * `<textarea>` — no contentEditable, no extra rendering complexity.
 */

export type TextEdit = {
  value: string
  selectionStart: number
  selectionEnd: number
}

interface Selection {
  value: string
  start: number
  end: number
}

/** Wrap the selection with `prefix`/`suffix`; falls back to `placeholder` text when nothing is selected. */
export function wrapSelection(
  { value, start, end }: Selection,
  prefix: string,
  suffix: string,
  placeholder: string,
): TextEdit {
  const selected = value.slice(start, end) || placeholder
  const nextValue = value.slice(0, start) + prefix + selected + suffix + value.slice(end)
  const selectionStart = start + prefix.length
  const selectionEnd = selectionStart + selected.length
  return { value: nextValue, selectionStart, selectionEnd }
}

/** Prefix every line touched by the selection (or the current line) with a list marker. */
export function applyLinePrefix(
  { value, start, end }: Selection,
  makePrefix: (lineIndex: number) => string,
): TextEdit {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const nextNewline = value.indexOf('\n', end)
  const lineEnd = nextNewline === -1 ? value.length : nextNewline

  const block = value.slice(lineStart, lineEnd)
  const lines = block.length > 0 ? block.split('\n') : ['']
  const prefixed = lines.map((line, index) => `${makePrefix(index)}${line}`).join('\n')

  const nextValue = value.slice(0, lineStart) + prefixed + value.slice(lineEnd)
  const delta = prefixed.length - block.length

  return {
    value: nextValue,
    selectionStart: lineStart,
    selectionEnd: lineEnd + delta,
  }
}

export function applyBulletList(selection: Selection): TextEdit {
  return applyLinePrefix(selection, () => '- ')
}

export function applyNumberedList(selection: Selection): TextEdit {
  return applyLinePrefix(selection, (index) => `${index + 1}. `)
}

/** Inline backticks for a one-liner, a fenced block once the selection spans multiple lines. */
export function applyCode({ value, start, end }: Selection): TextEdit {
  const selected = value.slice(start, end)
  if (selected.includes('\n')) {
    const nextValue = value.slice(0, start) + '```\n' + selected + '\n```' + value.slice(end)
    const selectionStart = start + 4
    return { value: nextValue, selectionStart, selectionEnd: selectionStart + selected.length }
  }
  return wrapSelection({ value, start, end }, '`', '`', 'code')
}

/** Insert `[text](url)`, leaving the `url` placeholder selected so the user can paste/type over it. */
export function applyLink({ value, start, end }: Selection): TextEdit {
  const linkText = value.slice(start, end) || 'link text'
  const template = `[${linkText}](url)`
  const nextValue = value.slice(0, start) + template + value.slice(end)
  const urlStart = start + linkText.length + 3
  return { value: nextValue, selectionStart: urlStart, selectionEnd: urlStart + 3 }
}
