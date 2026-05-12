/** Strip tags for length validation (approximate plain-text length). */
export function plainTextFromHtml(html: string): string {
  const withoutTags = html.replace(/<[^>]*>/g, ' ')
  return withoutTags.replace(/\s+/g, ' ').trim()
}