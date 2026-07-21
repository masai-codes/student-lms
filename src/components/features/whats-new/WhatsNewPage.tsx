import { getRouteApi, useNavigate, Link } from '@tanstack/react-router'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import AppPagination from '@/components/common/Pagination'
import { fetchWhatsNew } from '@/lib/api/whats-new/whatsNewApi'
import type { WhatsNewItem } from '@/server/api/whats-new/getWhatsNew.service'

const WHATS_NEW_PER_PAGE = 10
const STALE_TIME_MS = 5 * 60 * 1000

const routeApi = getRouteApi('/(protected)/_layout/whats-new/')

// ── Item Card ──────────────────────────────────────────────────────────────────

function WhatsNewCard({ item }: { item: WhatsNewItem }) {
  return (
    <Link
      to="/whats-new/$id"
      params={{ id: String(item.id) }}
      className="block rounded-[8px] border border-border bg-surface transition-shadow shadow-sm hover:shadow-md no-underline overflow-hidden"
    >
      <div className="flex items-stretch gap-0">
        {/* Left blue accent bar */}
        <div className="w-1 shrink-0 bg-info rounded-l-[8px]" />

        {/* Content */}
        <div className="flex flex-col gap-1 px-4 py-3">
          <p className="text-[15px] font-semibold text-foreground leading-snug break-words">
            {item.title}
          </p>
          {item.createdAt ? (
            <p className="text-[13px] text-foreground-muted">
              {item.createdAt}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function WhatsNewCardSkeleton() {
  return (
    <div className="rounded-[8px] border border-border bg-surface overflow-hidden">
      <div className="flex items-stretch gap-0">
        <div className="w-1 shrink-0 bg-info-subtle rounded-l-[8px]" />
        <div className="flex flex-col gap-2 px-4 py-3 flex-1">
          <div className="h-4 w-3/5 rounded bg-muted animate-pulse" />
          <div className="h-3 w-2/5 rounded bg-surface-muted animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function WhatsNewPage() {
  const { page } = routeApi.useSearch()
  const navigate = useNavigate()

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['whats-new', { page }],
    queryFn: () => fetchWhatsNew(page),
    staleTime: STALE_TIME_MS,
    placeholderData: keepPreviousData,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / WHATS_NEW_PER_PAGE))
  const safePage = Math.min(page, totalPages)

  function handlePageChange(newPage: number) {
    void navigate({ to: '/whats-new', search: { page: newPage } })
  }

  return (
    <div className="mx-4 mb-6 mt-4 md:mx-8 flex flex-col gap-4">
      {/* Header */}
      <h1 className="text-xl font-semibold text-foreground">Product Updates</h1>

      {/* Card list + pagination */}
      <div
        className={`rounded-2xl border border-border bg-surface p-6 flex flex-col gap-5 transition-opacity ${
          isFetching && !isLoading ? 'opacity-60' : 'opacity-100'
        }`}
      >
        <div className="flex flex-col gap-2.5">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <WhatsNewCardSkeleton key={i} />
            ))
          ) : items.length > 0 ? (
            items.map((item) => <WhatsNewCard key={item.id} item={item} />)
          ) : (
            <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
              <p className="text-sm text-foreground-subtle">
                No product updates yet.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <AppPagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  )
}
