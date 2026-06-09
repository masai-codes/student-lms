import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import createDOMPurify from 'dompurify'

type DiscussionContentProps = {
  /** Rich-text HTML body of the discussion. */
  html: string
  /** Number of lines to show before clamping. */
  collapsedLines?: number
}

/**
 * Renders a discussion's rich-text body. When the content is taller than
 * `collapsedLines`, it is clamped and a "View more" / "View less" toggle is
 * shown. The toggle only appears when the content actually overflows.
 */
export default function DiscussionContent({
  html,
  collapsedLines = 4,
}: DiscussionContentProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false)

  const sanitizedHtml =
    typeof window === 'undefined'
      ? html
      : createDOMPurify(window).sanitize(html)

  // Measure after layout so we know whether the clamped body overflows.
  useLayoutEffect(() => {
    const node = contentRef.current
    if (!node) return
    setIsOverflowing(node.scrollHeight > node.clientHeight + 1)
  }, [sanitizedHtml, collapsedLines])

  // Re-measure on resize since wrapping changes the line count.
  useEffect(() => {
    const node = contentRef.current
    if (!node || expanded) return
    const onResize = () =>
      setIsOverflowing(node.scrollHeight > node.clientHeight + 1)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [expanded])

  if (!sanitizedHtml.trim()) return null

  return (
    <div className="mt-1">
      <div
        ref={contentRef}
        className="break-words text-[14px] leading-5 text-[#374151] [overflow-wrap:anywhere] [&_a]:text-masaiverse-orange [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-[#E5E7EB] [&_blockquote]:pl-3 [&_li]:my-1 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5"
        style={
          expanded
            ? undefined
            : {
                display: '-webkit-box',
                WebkitLineClamp: collapsedLines,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }
        }
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
      {isOverflowing || expanded ? (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="mt-1 text-[12px] font-semibold text-masaiverse-orange hover:text-masaiverse-orange-dark"
        >
          {expanded ? 'View less' : 'View more'}
        </button>
      ) : null}
    </div>
  )
}
