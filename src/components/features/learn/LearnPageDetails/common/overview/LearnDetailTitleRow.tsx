'use client'

import type { ReactNode } from 'react'

type LearnDetailTitleRowProps = {
  title: string
  actions?: ReactNode
}

export function LearnDetailTitleRow({ title, actions }: LearnDetailTitleRowProps) {
  return (
    <section className="flex flex-col gap-4 justify-between sm:flex-row sm:items-start">
      <h1 className="type-h4 max-w-[min(100%,48rem)] pr-4 text-gray-900">{title}</h1>
      {actions != null ? (
        <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>
      ) : null}
    </section>
  )
}
