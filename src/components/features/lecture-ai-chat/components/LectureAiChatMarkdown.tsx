'use client'

import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import { LectureAiChatCodeBlock } from './LectureAiChatCodeBlock'
import type { Components } from 'react-markdown'

import { markdownSanitizeSchema } from '@/components/shared/markdown-content/sanitizeSchema'

const markdownComponents: Components = {
  // Block code is emitted as <pre><code>. Render our own block wrapper and let
  // <pre> pass through so the block isn't double-wrapped.
  pre: ({ children }) => <>{children}</>,
  code({ className, children }) {
    const text = String(children ?? '')
    const languageMatch = /language-(\w+)/.exec(className ?? '')
    const isBlock = Boolean(languageMatch) || text.includes('\n')

    if (isBlock) {
      return (
        <LectureAiChatCodeBlock
          code={text.replace(/\n$/, '')}
          language={languageMatch?.[1]}
        />
      )
    }

    return <code className="lecture-ai-chat-inline-code">{children}</code>
  },
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
}

type LectureAiChatMarkdownProps = {
  content: string
}

function LectureAiChatMarkdownImpl({ content }: LectureAiChatMarkdownProps) {
  return (
    <div className="lecture-ai-chat-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

// Re-parsing markdown only matters for the streaming message; memoize so
// settled messages don't re-render as new tokens arrive elsewhere.
export const LectureAiChatMarkdown = memo(LectureAiChatMarkdownImpl)
