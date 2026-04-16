import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import remarkGfm from "remark-gfm"
import type { Options as SanitizeOptions } from "rehype-sanitize"

type RichContentProps = {
  value: string
  className?: string
}

const sanitizeSchema: SanitizeOptions = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "video"],
  attributes: {
    ...(defaultSchema.attributes ?? {}),
    video: [
      "src",
      "controls",
      "poster",
      "preload",
      "playsInline",
      "muted",
      "loop",
      "width",
      "height",
    ],
    source: [...(defaultSchema.attributes?.source ?? []), "src", "type"],
  },
}

const HTML_ENTITY_MAP: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
}

function decodeHtmlEntities(value: string) {
  return Object.entries(HTML_ENTITY_MAP).reduce(
    (result, [entity, replacement]) => result.split(entity).join(replacement),
    value,
  )
}

function decodeMarkdownPayload(content: string): string {
  if (!content) return ""

  if (content.includes("&lt;") || content.includes("&gt;")) {
    const parser = new DOMParser()
    const decoded = parser.parseFromString(content, "text/html").documentElement.textContent
    return decoded ?? content
  }

  return content
}

export function toRichPreviewText(value: string) {
  const decoded = decodeHtmlEntities(decodeMarkdownPayload(value || ""))

  return decoded
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[.*?\]\((.*?)\)/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/[#>*_`~-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function RichContent({ value, className }: RichContentProps) {
  if (!value.trim()) return null

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
      >
        {decodeMarkdownPayload(value)}
      </ReactMarkdown>
    </div>
  )
}
