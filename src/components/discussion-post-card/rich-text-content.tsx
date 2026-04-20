"use client"

import * as React from "react"
import createDOMPurify from "dompurify"

type RichTextContentProps = {
  html: string
  className?: string
}

export function RichTextContent({ html, className = "" }: RichTextContentProps) {
  const sanitizedHtml = React.useMemo(() => {
    if (typeof window === "undefined") return html
    const purifier = createDOMPurify(window)
    return purifier.sanitize(html)
  }, [html])

  return (
    <div
      className={`break-words [overflow-wrap:anywhere] [&_h1]:my-2 [&_h1]:text-[28px] [&_h1]:font-[700] [&_h1]:leading-[36px] [&_h1]:break-words [&_h2]:my-2 [&_h2]:text-[22px] [&_h2]:font-[600] [&_h2]:leading-[30px] [&_h2]:break-words [&_h3]:my-2 [&_h3]:text-[18px] [&_h3]:font-[600] [&_h3]:leading-[26px] [&_h3]:break-words [&_p]:my-2 [&_p]:break-words [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_li]:break-words [&_blockquote]:border-l-2 [&_blockquote]:border-[#E5E7EB] [&_blockquote]:pl-3 [&_blockquote]:break-words ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}
