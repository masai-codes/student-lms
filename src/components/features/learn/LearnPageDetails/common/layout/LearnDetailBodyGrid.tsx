'use client'

import type { ReactNode } from 'react'

type LearnDetailBodyGridProps = {
  mainPlaceholder?: string
  asidePlaceholder?: string
  main?: ReactNode
  aside?: ReactNode
}

/** 70 / 10-cols main + 30% aside shell; entity pages pass copy or real nodes. */
export function LearnDetailBodyGrid({
  mainPlaceholder,
  asidePlaceholder,
  main,
  aside,
}: LearnDetailBodyGridProps) {
  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-10">
      <div className="min-h-[200px] rounded-lg border border-dashed border-gray-300 bg-gray-50/80 p-4 lg:col-span-7">
        {main ?? (
          <p className="type-b2-regular text-muted-foreground">{mainPlaceholder ?? ''}</p>
        )}
      </div>
      <div className="flex min-h-[200px] flex-col rounded-lg border border-gray-200 bg-white p-4 lg:col-span-3">
        {aside ?? (
          <p className="type-b2-regular text-muted-foreground">{asidePlaceholder ?? ''}</p>
        )}
      </div>
    </section>
  )
}
