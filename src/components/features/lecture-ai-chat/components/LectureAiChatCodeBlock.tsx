'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

type LectureAiChatCodeBlockProps = {
  code: string
  language?: string
}

export function LectureAiChatCodeBlock({
  code,
  language,
}: LectureAiChatCodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable (e.g. insecure context) — nothing to do.
    }
  }

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-border bg-muted">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          {language ?? 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code"
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="size-3.5" /> Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" /> Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-sm leading-relaxed">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  )
}
