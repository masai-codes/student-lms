import { MATH_SENTINEL } from './normalizeMathSpans'

const LIST_ITEM_PATTERN = /^\s*([-*+]|\d+\.)\s/

function isListMarkerLine(line: string): boolean {
  return LIST_ITEM_PATTERN.test(line)
}

function isContinuationLine(line: string): boolean {
  const trimmed = line.trim()
  if (trimmed === '') return false
  if (isListMarkerLine(line)) return false
  if (/^#{1,6}\s/.test(trimmed)) return false
  // A masked math span is a block boundary, not list-item continuation, so it
  // must not be slurped/indented into the preceding list (which would break
  // block math like `$$...$$` that follows a bulleted list).
  if (trimmed.includes(MATH_SENTINEL)) return false
  return true
}

/**
 * Keeps lines after a list marker inside the same list item (GFM treats a blank line
 * as ending the item, which breaks bullets + spacing for instruction-style content).
 */
export function normalizeListContinuations(markdown: string): string {
  const lines = markdown.split('\n')
  const out: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    out.push(line)

    if (!isListMarkerLine(line)) continue

    let j = i + 1
    while (j < lines.length) {
      const next = lines[j]

      if (next.trim() === '') {
        const afterBlank = lines[j + 1]
        if (afterBlank !== undefined && isContinuationLine(afterBlank)) {
          j += 1
          continue
        }
        break
      }

      if (isListMarkerLine(next)) break

      if (isContinuationLine(next)) {
        const indented = next.startsWith('  ') ? next : `  ${next}`
        out.push(indented)
        j += 1
        continue
      }

      break
    }

    i = j - 1
  }

  return out.join('\n')
}

export function collapseExcessiveBlankLines(markdown: string): string {
  return markdown.replace(/\n{3,}/g, '\n\n')
}

export function normalizeMarkdownForDisplay(markdown: string): string {
  return collapseExcessiveBlankLines(normalizeListContinuations(markdown))
}
