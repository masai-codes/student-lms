'use client'

import { cn } from '@/lib/utils'

type LectureTitleStripProps = {
  title: string
  className?: string
}

/** Title bar directly under the video player (YouTube-style primary heading). */
export function LectureTitleStrip({
  title,
  className,
}: LectureTitleStripProps) {
  return (
    <section
      className={cn('border-b border-border bg-background py-3 ', className)}
    >
      <h1 className="type-h5 line-clamp-2 min-w-0 break-words text-foreground">
        {title}
      </h1>
    </section>
  )
}
