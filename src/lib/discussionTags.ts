/**
 * Tags are entered comma-separated and stored *appended to the post content*
 * behind a marker, so the existing `content` column carries them. On read we
 * split them back out: the API returns `tags` separately and content without
 * the marker.
 *
 * Marker form (kept as an HTML comment so it never renders): `<!--tags:a,b,c-->`
 */
const TAGS_MARKER_REGEX = /<!--tags:([^<>]*)-->\s*$/

/** Parses a comma-separated tag string into a clean, de-duplicated list. */
export function parseTagsInput(input: string): Array<string> {
  const seen = new Set<string>()
  const tags: Array<string> = []
  for (const raw of input.split(',')) {
    const tag = sanitizeTag(raw)
    const key = tag.toLowerCase()
    if (tag && !seen.has(key)) {
      seen.add(key)
      tags.push(tag)
    }
  }
  return tags
}

/** Appends the tags marker to the content HTML (no-op when there are no tags). */
export function serializeContentWithTags(
  html: string,
  tags: Array<string>,
): string {
  const clean = tags.map(sanitizeTag).filter(Boolean)
  if (clean.length === 0) return html
  return `${html}<!--tags:${clean.join(',')}-->`
}

/** Splits stored content into its body HTML and the tag list. */
export function parseContentWithTags(stored: string): {
  content: string
  tags: Array<string>
} {
  const match = stored.match(TAGS_MARKER_REGEX)
  if (!match) return { content: stored, tags: [] }
  const tags = match[1]
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
  return { content: stored.slice(0, match.index).trimEnd(), tags }
}

/** Strips characters that would corrupt the marker or comma list. */
function sanitizeTag(tag: string): string {
  return tag
    .replace(/[<>,]/g, ' ')
    .replace(/-{2,}/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}
