import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import createDOMPurify from 'dompurify'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../../tracking'

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

  const sanitizedHtml = (() => {
    if (typeof window === 'undefined') return html
    const purify = createDOMPurify(window)
    // Force every link in the discussion body to open in a new tab.
    purify.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName === 'A') {
        node.setAttribute('target', '_blank')
        node.setAttribute('rel', 'noopener noreferrer')
      }
    })
    return purify.sanitize(html)
  })()

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
        className="break-words text-[14px] leading-5 text-foreground [overflow-wrap:anywhere] [&_a]:text-accent-warm [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_li]:my-1 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5"
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
          onClick={() => {
            trackMasaiverse(MASAIVERSE_EVENTS.discussionExpandToggle, {
              expanded: !expanded,
            })
            setExpanded((open) => !open)
          }}
          className="mt-1 text-[12px] font-semibold text-accent-warm hover:text-accent-warm-hover"
        >
          {expanded ? 'View less' : 'View more'}
        </button>
      ) : null}
    </div>
  )
}
