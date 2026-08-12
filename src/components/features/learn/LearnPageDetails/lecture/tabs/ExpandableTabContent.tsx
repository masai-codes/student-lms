'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

type ExpandableTabContentProps = {
  children: React.ReactNode
  className?: string
  /** Max collapsed height in pixels. Defaults to 240. */
  collapsedHeightPx?: number
}

const DEFAULT_COLLAPSED_HEIGHT_PX = 240

function preserveScrollPosition(action: () => void) {
  if (typeof window === 'undefined') {
    action()
    return
  }
  const scrollY = window.scrollY
  action()
  requestAnimationFrame(() => {
    window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' })
  })
}

/**
 * YouTube-style fixed-height section with a "Show more" / "Show less" toggle.
 * Caps the collapsed view to `collapsedHeightPx`, fades the bottom edge to the
 * surrounding `gray-100` panel, and only renders the toggle when the natural
 * content actually overflows the cap.
 */
export function ExpandableTabContent({
  children,
  className,
  collapsedHeightPx = DEFAULT_COLLAPSED_HEIGHT_PX,
}: ExpandableTabContentProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)

  useLayoutEffect(() => {
    const el = contentRef.current
    if (!el) return
    setOverflowing(el.scrollHeight > collapsedHeightPx + 1)
  }, [children, collapsedHeightPx])

  useEffect(() => {
    const el = contentRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      setOverflowing(el.scrollHeight > collapsedHeightPx + 1)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [collapsedHeightPx])

  const isCollapsed = !expanded && overflowing
  const showToggle = overflowing || expanded

  const handleToggle = () => {
    preserveScrollPosition(() => {
      setExpanded((value) => !value)
    })
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="relative">
        <div
          ref={contentRef}
          data-testid="expandable-tab-content-body"
          style={
            isCollapsed
              ? { maxHeight: `${collapsedHeightPx}px`, overflow: 'hidden' }
              : undefined
          }
        >
          {children}
        </div>
        {isCollapsed ? (
          <div
            aria-hidden
            data-testid="expandable-tab-content-fade"
            // Fade must match the surrounding LectureTabPanel fill: gray-100 in
            // light, `surface` in dark (the panel is `dark:bg-surface`).
            className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-gray-100 to-transparent dark:from-surface"
          />
        ) : null}
      </div>
      {showToggle ? (
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={handleToggle}
          className="type-b2-md mt-3 text-primary-600 hover:underline dark:text-brand"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      ) : null}
    </div>
  )
}
