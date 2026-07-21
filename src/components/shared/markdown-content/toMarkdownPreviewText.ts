import { decodeMarkdownPayload } from './decodeMarkdownPayload'

const HTML_ENTITY_MAP: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
}

function decodeHtmlEntities(value: string) {
  return Object.entries(HTML_ENTITY_MAP).reduce(
    (result, [entity, replacement]) => result.split(entity).join(replacement),
    value,
  )
}

export function toMarkdownPreviewText(value: string) {
  const decoded = decodeHtmlEntities(decodeMarkdownPayload(value || ''))

  return decoded
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[.*?\]\((.*?)\)/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/[#>*_`~-]/g, '')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
