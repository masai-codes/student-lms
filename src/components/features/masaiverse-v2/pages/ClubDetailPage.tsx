import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft } from '@phosphor-icons/react'
import InlineDrawer from '../InlineDrawer'
import AboutClubSection from './club/AboutClubSection'
import ClubDetailBanner from './club/ClubDetailBanner'
import ClubDiscussionsSection from './club/ClubDiscussionsSection'
import ClubLeaderboardSection from './club/ClubLeaderboardSection'
import ClubPastSection from './club/ClubPastSection'
import ClubPhotosSection from './club/ClubPhotosSection'
import ClubStatsSection from './club/ClubStatsSection'
import ClubUpcomingSection from './club/ClubUpcomingSection'
import LearningTenureSection from './club/LearningTenureSection'
import WeeklyConnectsSection from './club/WeeklyConnectsSection'
import CalendarPanel from './home/calendar/CalendarPanel'
import { ApiClientError } from '@/lib/api/apiClientError'
import { recordMasaiverseV2ClubVisit } from '@/lib/api/masaiverse-v2/masaiverseV2Api'
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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // Members get their `lastVisitedAt` stamped on each visit. Non-members never
  // hit the endpoint. Best-effort: failures must not affect the page.
  const isMember = club?.isJoined === true
  useEffect(() => {
    if (!isMember) return
    void recordMasaiverseV2ClubVisit(clubId).catch(() => {})
  }, [clubId, isMember])

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

  const toggleCalendar = () => setIsCalendarOpen((open) => !open)

  return (
    <InlineDrawer
      open={isCalendarOpen}
      panel={<CalendarPanel />}
      title="Schedule"
      onClose={() => setIsCalendarOpen(false)}
    >
      <div className="flex flex-col gap-6">
        <BackToClubsLink />
        <ClubDetailBanner club={club} />
        <ClubStatsSection clubId={clubId} />
        <AboutClubSection club={club} />
        <LearningTenureSection club={club} />
        <WeeklyConnectsSection clubId={clubId} onViewSchedule={toggleCalendar} />
        <ClubUpcomingSection clubId={clubId} onViewCalendar={toggleCalendar} />
        <ClubPastSection clubId={clubId} />
        <ClubLeaderboardSection clubId={clubId} />
        <ClubPhotosSection club={club} />
        <ClubDiscussionsSection clubId={clubId} />
      </div>
    </InlineDrawer>
  )
}
