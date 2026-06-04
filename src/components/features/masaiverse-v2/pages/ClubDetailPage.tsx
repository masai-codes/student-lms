import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft } from '@phosphor-icons/react'
import ClubDetailBanner from './club/ClubDetailBanner'
import { ApiClientError } from '@/lib/api/apiClientError'
import { masaiverseV2ClubDetailQuery } from '@/query/masaiverse-v2/clubsQuery'

type ClubDetailPageProps = {
  clubId: string
}

function BackToClubsLink() {
  return (
    <Link
      to="/masaiverse/clubs"
      search={(prev) => prev}
      className="inline-flex items-center gap-1 text-[14px] font-medium text-[#6B7280] hover:text-[#111827]"
    >
      <ArrowLeft size={16} />
      Back to clubs
    </Link>
  )
}

/**
 * Dedicated club page. The hero banner is the first of several sections that
 * will grow to mirror the home page; data is fetched live by `clubId`.
 */
export default function ClubDetailPage({ clubId }: ClubDetailPageProps) {
  const { data: club, isPending, error } = useQuery(
    masaiverseV2ClubDetailQuery(clubId),
  )

  if (isPending) {
    return (
      <div>
        <BackToClubsLink />
        <div
          role="status"
          aria-label="Loading club"
          className="mt-4 h-48 animate-pulse rounded-[20px] bg-[#ECE7E2]"
        >
          <span className="sr-only">Loading club…</span>
        </div>
      </div>
    )
  }

  if (error) {
    const notFound = error instanceof ApiClientError && error.status === 404
    return (
      <div>
        <BackToClubsLink />
        <h2 className="mt-4 text-[20px] font-bold leading-7 text-[#111827]">
          {notFound ? 'Club not found' : 'Something went wrong'}
        </h2>
        <p className="mt-1 text-[14px] leading-5 text-[#6B7280]">
          {notFound
            ? `We couldn't find a club with id "${clubId}".`
            : "We couldn't load this club. Please try again."}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <BackToClubsLink />
      <ClubDetailBanner club={club} />
      {/* More sections (about, events, discussions…) will be added here. */}
    </div>
  )
}
