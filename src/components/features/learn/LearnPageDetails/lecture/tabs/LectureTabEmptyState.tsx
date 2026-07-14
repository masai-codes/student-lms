'use client'

import type { ReactNode } from 'react'

type LectureTabEmptyStateProps = {
  title: string
  description: ReactNode
}

export function LectureTabEmptyState({
  title,
  description,
}: LectureTabEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <p className="type-b1-md text-foreground">{title}</p>
      <p className="type-b2-regular max-w-sm text-foreground-muted">
        {description}
      </p>
    </div>
  )
}
