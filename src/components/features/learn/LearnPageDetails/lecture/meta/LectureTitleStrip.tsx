'use client'

import { cn } from '@/lib/utils'

type LectureTitleStripProps = {
  title: string
  className?: string
}

/** Title bar directly under the video player (YouTube-style primary heading). */
export function LectureTitleStrip({ title, className }: LectureTitleStripProps) {
  return (
    <section
      className={cn(
        'border-b border-border bg-background px-4 py-3 md:px-6',
        className,
      )}
    >
      <h1 className="type-h5 line-clamp-2 text-gray-900">{title}</h1>
    </section>
  )
}
