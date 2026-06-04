import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import ClubLeaderboardRow from './ClubLeaderboardRow'
import type { ClubLeaderboardPage } from '@/server/api/masaiverse-v2/services/getClubLeaderboard.service'
import { masaiverseV2ClubLeaderboardQuery } from '@/query/masaiverse-v2/clubsQuery'

type ClubLeaderboardSectionProps = {
  clubId: string
  /**
   * First page of the leaderboard embedded in the club detail payload; seeds
   * page 0 so the section renders without an extra request. Later pages are
   * still fetched on demand.
   */
  initialLeaderboard?: ClubLeaderboardPage
}

const PER_PAGE = 5

function SectionHeading() {
  return (
    <div className="flex items-baseline gap-2">
      <h2 className="text-[22px] font-extrabold leading-7 text-[#111827]">
        Club Leaderboard
      </h2>
    </div>
  )
}

/**
 * Club detail leaderboard — ranks the club's members by their club-scoped
 * points, five per page. Members with no points are omitted, and the board is
 * paginated via Prev/Next rather than a full-board link.
 */
export default function ClubLeaderboardSection({
  clubId,
  initialLeaderboard,
}: ClubLeaderboardSectionProps) {
  const [page, setPage] = useState(0)
  const { data, isPending, isError } = useQuery({
    ...masaiverseV2ClubLeaderboardQuery(clubId, page, PER_PAGE),
    placeholderData: keepPreviousData,
    ...(page === 0 && initialLeaderboard
      ? { initialData: initialLeaderboard }
      : {}),
  })

  const entries = data?.entries ?? []
  const showPager = page > 0 || (data?.hasMore ?? false)

  return (
    <section className="flex flex-col gap-4">
      <SectionHeading />
      {isPending ? (
        <LeaderboardSkeleton />
      ) : isError ? (
        <p className="rounded-[16px] border border-[#EDEAE8] bg-white p-6 text-[14px] text-[#6B7280]">
          We couldn&apos;t load the leaderboard. Please try again.
        </p>
      ) : entries.length === 0 ? (
        <p className="rounded-[16px] border border-[#EDEAE8] bg-white p-6 text-[14px] text-[#6B7280]">
          No points have been earned in this club yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <ClubLeaderboardRow key={entry.userId} entry={entry} />
          ))}
        </div>
      )}
      {showPager ? (
        <div className="flex items-center justify-end gap-2">
          <PagerButton
            label="Previous page"
            disabled={page === 0}
            onClick={() => setPage((current) => Math.max(current - 1, 0))}
          >
            <CaretLeft size={16} />
          </PagerButton>
          <span className="text-[13px] text-[#6B7280]">Page {page + 1}</span>
          <PagerButton
            label="Next page"
            disabled={!data?.hasMore}
            onClick={() => setPage((current) => current + 1)}
          >
            <CaretRight size={16} />
          </PagerButton>
        </div>
      ) : null}
    </section>
  )
}

function PagerButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-full border border-[#EDEAE8] bg-white text-[#374151] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}

function LeaderboardSkeleton() {
  return (
    <div
      className="flex flex-col gap-3"
      role="status"
      aria-label="Loading leaderboard"
    >
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-[72px] animate-pulse rounded-[16px] bg-[#ECE7E2]"
        />
      ))}
      <span className="sr-only">Loading leaderboard…</span>
    </div>
  )
}
