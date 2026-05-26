export function decodeMarkdownPayload(content: string): string {
  if (!content) return ''

  const normalizedContent = content
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')

  if (!normalizedContent.includes('&lt;') && !normalizedContent.includes('&gt;')) {
    return normalizedContent
  }

  if (typeof document === 'undefined') {
    return normalizedContent
  }

  const decoded = new DOMParser()
    .parseFromString(normalizedContent, 'text/html')
    .documentElement.textContent

  return decoded ?? normalizedContent
}
