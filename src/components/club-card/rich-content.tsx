import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import remarkGfm from "remark-gfm"
import type { Options as SanitizeOptions } from "rehype-sanitize"
import type { Components } from "react-markdown"

type RichContentProps = {
  value: string
  className?: string
}

const markdownComponents: Components = {
  h1: ({ node, ...props }) => (
    <h1 className="mt-6 mb-3 text-[28px] leading-[34px] font-semibold text-[#111928]" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="mt-6 mb-3 text-[24px] leading-[30px] font-semibold text-[#111928]" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="mt-5 mb-2 text-[38px] leading-[46px] font-semibold text-[#111928]" {...props} />
  ),
  h4: ({ node, ...props }) => (
    <h4 className="mt-4 mb-2 text-[18px] leading-[24px] font-semibold text-[#111928]" {...props} />
  ),
  h5: ({ node, ...props }) => (
    <h5 className="mt-4 mb-2 text-[16px] leading-[22px] font-semibold text-[#111928]" {...props} />
  ),
  h6: ({ node, ...props }) => (
    <h6 className="mt-3 mb-2 text-[14px] leading-[20px] font-semibold text-[#111928]" {...props} />
  ),
  hr: ({ node, ...props }) => <hr className="my-4 border-0 border-t border-[#D1D5DB]" {...props} />,
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

  const normalizedContent = content
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")

  if (normalizedContent.includes("&lt;") || normalizedContent.includes("&gt;")) {
    const parser = new DOMParser()
    const decoded = parser
      .parseFromString(normalizedContent, "text/html")
      .documentElement.textContent
    return decoded ?? normalizedContent
  }

  return normalizedContent
}

export function toRichPreviewText(value: string) {
  const decoded = decodeHtmlEntities(decodeMarkdownPayload(value || ""))

  return decoded
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[.*?\]\((.*?)\)/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/[#>*_`~-]/g, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function RichContent({ value, className }: RichContentProps) {
  if (!value.trim()) return null

  return (
    <div
      className={cn(
        "min-w-0 max-w-full break-words [&_a]:break-all [&_code]:break-all [&_li]:min-w-0 [&_li]:whitespace-pre-wrap [&_ol]:min-w-0 [&_p]:min-w-0 [&_p]:whitespace-pre-wrap [&_ul]:min-w-0",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        components={markdownComponents}
      >
        {decodeMarkdownPayload(value)}
      </ReactMarkdown>
    </div>
  )
}
