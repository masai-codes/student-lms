import { useState } from 'react'
import { Question } from '@phosphor-icons/react'

import type { SupportFaq } from '@/server/api/support/support.types'
import { Skeleton } from '@/components/ui/skeleton'
import { Pressable } from '@/components/ui/pressable'
import { FaqItem } from '@/components/features/support/FaqItem'

/**
 * FaqList — the accordion of FAQ results.
 *
 * Renders skeletons while loading, the articles when present, and a friendly
 * "no answers — raise a ticket" empty state when a search returns nothing (never
 * a blank wall). Owns only the locally-expanded item; data + search live in the
 * parent.
 */
export function FaqList({
  faqs,
  loading,
  query,
  onRaiseTicket,
}: {
  faqs: Array<SupportFaq>
  loading?: boolean
  query?: string
  onRaiseTicket: (faq?: SupportFaq) => void
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-2xl" />
        ))}
      </div>
    )
  }

  if (faqs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
        <Question className="size-8 text-muted-foreground" />
        <div>
          <p className="font-medium text-foreground">
            {query ? `No answers found for “${query}”` : 'No FAQs here yet'}
          </p>
          <p className="text-sm text-muted-foreground">
            Raise a ticket and a coordinator will help you out.
          </p>
        </div>
        <Pressable
          onClick={() => onRaiseTicket()}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          {query ? `Raise a ticket about “${query}”` : 'Raise a support ticket'}
        </Pressable>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {faqs.map((faq) => (
        <FaqItem
          key={faq.id}
          faq={faq}
          expanded={expandedId === faq.id}
          onToggle={() => setExpandedId((id) => (id === faq.id ? null : faq.id))}
          onRaiseTicket={() => onRaiseTicket(faq)}
        />
      ))}
    </div>
  )
}
