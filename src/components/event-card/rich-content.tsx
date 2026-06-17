import { MarkdownContent, toMarkdownPreviewText } from '@/components/shared/markdown-content'

type RichContentProps = {
  value: string
  className?: string
}

export function RichContent({ value, className }: RichContentProps) {
  return <MarkdownContent value={value} className={className} variant="detail" />
}

export { toMarkdownPreviewText as toRichPreviewText }
