import { MarkdownContent, toMarkdownPreviewText } from '@/components/shared/markdown-content'

type RichContentProps = {
  value: string
  className?: string
}

export function RichContent({ value, className }: RichContentProps) {
  if (!value.trim()) return null

  return <MarkdownContent value={value} className={className} />
}

export { toMarkdownPreviewText as toRichPreviewText }
