import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChatCircleDots, Phone } from '@phosphor-icons/react'

import type {
  SupportCategory,
  SupportFaq,
} from '@/server/api/support/support.types'
import { Skeleton } from '@/components/ui/skeleton'
import { Pressable } from '@/components/ui/pressable'
import {
  supportFaqsQuery,
  supportOverviewQuery,
} from '@/query/support/supportQueries'
import { CategoryGrid } from '@/components/features/support/CategoryGrid'
import { CallbackSheet } from '@/components/features/support/CallbackSheet'
import { CoordinatorCard } from '@/components/features/support/CoordinatorCard'
import { CreateTicketSheet } from '@/components/features/support/CreateTicketSheet'
import { FaqList } from '@/components/features/support/FaqList'
import { GateBanner } from '@/components/features/support/GateBanner'
import { SupportSearchBar } from '@/components/features/support/SupportSearchBar'
import { TicketCard } from '@/components/features/support/TicketCard'

/** Local debounce so live FAQ search doesn't fire on every keystroke. */
function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

/**
 * SupportHome — the search-first `/support` landing.
 *
 * Renders entirely from the single {@link supportOverviewQuery} payload. Layout
 * (top → bottom): header + open-tickets, gate banner, search, your open tickets,
 * browse categories, FAQ results, and the "talk to us" set (callback +
 * coordinators). Searching or picking a category swaps the FAQ list to a live
 * {@link supportFaqsQuery}; otherwise it shows the FAQs embedded in the overview.
 *
 * Self-service first: the search + FAQs are the hero; raising a ticket is the
 * fallback, reached from an FAQ that didn't help.
 */
export function SupportHome() {
  const { data: overview, isPending } = useQuery(supportOverviewQuery())

  const [batchId, setBatchId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<SupportCategory | null>(null)
  const [createCtx, setCreateCtx] = useState<{
    category: string
    subCategory?: string | null
    faq?: SupportFaq | null
  } | null>(null)
  const [callbackOpen, setCallbackOpen] = useState(false)

  // Default to the first batch once the overview loads.
  const activeBatchId = batchId ?? overview?.batches[0]?.id ?? null
  const debouncedSearch = useDebounced(search)
  const isSearching = debouncedSearch.trim() !== '' || category != null

  // Live FAQ search — only runs while searching/filtering.
  const { data: faqResults, isFetching: faqsFetching } = useQuery({
    ...supportFaqsQuery({
      batchId: activeBatchId ?? 0,
      search: debouncedSearch,
      category: category?.value,
    }),
    enabled: isSearching && activeBatchId != null,
  })

  const faqs = useMemo(
    () => (isSearching ? (faqResults?.faqs ?? []) : (overview?.faqs ?? [])),
    [isSearching, faqResults, overview],
  )

  const openCreate = (faq?: SupportFaq) => {
    if (faq) setCreateCtx({ category: faq.category, subCategory: faq.subCategory, faq })
    else if (category)
      setCreateCtx({ category: category.value, subCategory: category.subcategories[0]?.value })
    else setCreateCtx({ category: 'general' })
  }

  if (isPending || !overview) return <SupportHomeSkeleton />

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">How can we help?</h1>
        {overview.batches.length > 1 && (
          <select
            value={activeBatchId ?? ''}
            onChange={(e) => setBatchId(Number(e.target.value))}
            className="rounded-lg border border-border bg-card px-2 py-1 text-sm"
            aria-label="Choose batch"
          >
            {overview.batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <GateBanner reason={overview.gateReason} />

      <SupportSearchBar
        value={search}
        onChange={setSearch}
        resultCount={isSearching ? faqs.length : undefined}
      />

      {/* Your open tickets — visible but not competing with self-service. */}
      {overview.tickets.length > 0 && !isSearching && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Your open tickets
          </h2>
          <div className="space-y-2">
            {overview.tickets.slice(0, 3).map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </section>
      )}

      {/* Browse categories (hidden while searching by text) */}
      {debouncedSearch.trim() === '' && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Browse by topic</h2>
          <CategoryGrid
            categories={overview.categories}
            activeCategory={category?.value}
            onSelect={setCategory}
          />
        </section>
      )}

      {/* FAQ results */}
      <section className="space-y-3">
        {isSearching && (
          <h2 className="text-sm font-semibold text-muted-foreground">
            {category ? `${category.label} FAQs` : 'Search results'}
          </h2>
        )}
        <FaqList
          faqs={faqs}
          loading={isSearching && faqsFetching}
          query={debouncedSearch.trim() || undefined}
          onRaiseTicket={openCreate}
        />
      </section>

      {/* Talk to us */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Still stuck?</h2>
        <Pressable
          onClick={() => setCallbackOpen(true)}
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left hover:shadow-sm"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Phone className="size-5" weight="duotone" />
          </span>
          <div className="flex-1">
            <p className="font-semibold text-foreground">Request a callback</p>
            <p className="text-sm text-muted-foreground">
              We’ll call you back at your preferred time.
            </p>
          </div>
        </Pressable>

        {overview.coordinators.length > 0 && (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 px-1 text-xs font-medium text-muted-foreground">
              <ChatCircleDots className="size-3.5" /> Book a 1:1 with your coordinators
            </p>
            {overview.coordinators.map((c) => (
              <CoordinatorCard key={c.id} coordinator={c} />
            ))}
          </div>
        )}
      </section>

      {/* Overlays */}
      {activeBatchId != null && createCtx && (
        <CreateTicketSheet
          open
          onClose={() => setCreateCtx(null)}
          batchId={activeBatchId}
          context={createCtx}
        />
      )}
      {activeBatchId != null && (
        <CallbackSheet
          open={callbackOpen}
          onClose={() => setCallbackOpen(false)}
          batchId={activeBatchId}
          reasons={overview.callback.reasons}
          timeslots={overview.callback.timeslots}
        />
      )}
    </div>
  )
}

function SupportHomeSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-12 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-2xl" />
      ))}
    </div>
  )
}
