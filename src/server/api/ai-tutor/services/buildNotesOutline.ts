const MARKDOWN_HEADING_PATTERN = /^#{1,6}\s+\S/
const NOTES_OUTLINE_PREVIEW_CHARS = 600

export function buildNotesOutline(notes: string): string {
  const headings = notes
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => MARKDOWN_HEADING_PATTERN.test(line))

  if (headings.length > 0) {
    return headings.join('\n')
  }

  const preview = notes.trim().slice(0, NOTES_OUTLINE_PREVIEW_CHARS)
  if (notes.trim().length <= NOTES_OUTLINE_PREVIEW_CHARS) {
    return preview
  }

  return `${preview}...`
}
