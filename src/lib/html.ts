/** Strips HTML tags/entities to plain text — for length checks and previews. */
export function htmlPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
}
