import { MarkdownContent } from '@/components/shared/markdown-content'
import { cn } from '@/lib/utils'

type ChatbotAssistantMessageProps = {
  content: string
}

const messageBaseClass =
  'w-full rounded-[10px] px-2.5 py-2 text-[13px] leading-snug'

const markdownClass =
  '!text-[13px] !leading-snug [&_p]:!mb-2 [&_ul]:!mb-2 [&_ol]:!mb-2 [&_li]:!my-0.5'

export function ChatbotAssistantMessage({ content }: ChatbotAssistantMessageProps) {
  if (!content.trim()) {
    return null
  }

  return (
    <div className={cn(messageBaseClass, 'self-stretch  text-gray-900')}>
      <MarkdownContent value={content} variant="detail" className={markdownClass} />
    </div>
  )
}
