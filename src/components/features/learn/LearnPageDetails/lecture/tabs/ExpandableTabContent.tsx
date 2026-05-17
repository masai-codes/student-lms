'use client'

import { useLayoutEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

type ExpandableTabContentProps = {
  children: React.ReactNode
  className?: string
}

function preserveScrollPosition(action: () => void) {
  const scrollY = window.scrollY
  action()
  requestAnimationFrame(() => {
    window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' })
  })
}

/** Line-clamp show more / show less (YouTube-style, no max-height observers). */
export function ExpandableTabContent({
  children,
  className,
}: ExpandableTabContentProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [isClamped, setIsClamped] = useState(false)

  useLayoutEffect(() => {
    const el = contentRef.current
    if (!el) return

    if (expanded) {
      setIsClamped(true)
      return
    }

    setIsClamped(el.scrollHeight > el.clientHeight + 1)
  }, [children, expanded])

  const showToggle = isClamped || expanded

  const handleToggle = () => {
    preserveScrollPosition(() => {
      setExpanded(value => !value)
    })
  }

  return (
    <div className={cn('w-full', className)}>
      <div
        ref={contentRef}
        className={cn(
          'type-b2-regular text-gray-700',
          !expanded && 'line-clamp-6',
        )}
      >
        {children}
      </div>
      {showToggle ? (
        <button
          type="button"
          onMouseDown={event => event.preventDefault()}
          onClick={handleToggle}
          className="type-b2-md mt-2 text-[#6962AC] hover:underline"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      ) : null}
    </div>
  )
}
