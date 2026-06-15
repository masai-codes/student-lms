import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, PencilSimple } from '@phosphor-icons/react'
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
import LockedSection from './club/LockedSection'
import WeeklyConnectsSection from './club/WeeklyConnectsSection'
import CalendarPanel from './home/calendar/CalendarPanel'
import { ApiClientError } from '@/lib/api/apiClientError'
import { recordMasaiverseV2ClubVisit } from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import { masaiverseV2ClubDetailQuery } from '@/query/masaiverse-v2/clubsQuery'
import { masaiverseV2AdminModeQuery } from '@/query/masaiverse-v2/adminModeQuery'
import ClubEditForm from '@/components/features/masaiverse-v2/edit/ClubEditForm'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../tracking'

type ClubDetailPageProps = {
  clubId: string
}

function BackToClubsLink() {
  return (
    <Link
      to="/masaiverse/clubs"
      search={(prev) => prev}
      onClick={() =>
        trackMasaiverse(MASAIVERSE_EVENTS.backClick, { to: 'clubs' })
      }
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
  const { data: adminMode } = useQuery(masaiverseV2AdminModeQuery())
  const canEdit = adminMode?.enabled ?? false
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

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

  const toggleCalendar = () => {
    setIsEditOpen(false)
    setIsCalendarOpen((open) => !open)
  }
  const openEdit = () => {
    trackMasaiverse(MASAIVERSE_EVENTS.clubEditClick, { club_id: clubId })
    setIsCalendarOpen(false)
    setIsEditOpen(true)
  }
  const closeDrawer = () => {
    setIsCalendarOpen(false)
    setIsEditOpen(false)
  }

  return (
    <InlineDrawer
      open={isCalendarOpen || isEditOpen}
      // Render the panel only while open so its data fetch runs on demand
      // rather than eagerly on every club detail page load.
      panel={
        isEditOpen ? (
          <ClubEditForm clubId={clubId} onClose={closeDrawer} />
        ) : isCalendarOpen ? (
          <CalendarPanel />
        ) : null
      }
      panelWidth={isEditOpen ? 460 : 340}
      title={isEditOpen ? 'Edit club' : 'Schedule'}
      onClose={closeDrawer}
    >
      <div className="flex flex-col gap-5 md:gap-6">
        <div className="flex items-center justify-between gap-4">
          <BackToClubsLink />
          {canEdit ? (
            <button
              type="button"
              onClick={openEdit}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#111827] px-3.5 py-2 text-sm font-semibold text-[#111827] transition-colors hover:bg-[#111827] hover:text-white"
            >
              <PencilSimple size={16} weight="bold" />
              Edit club
            </button>
          ) : null}
        </div>
        <ClubDetailBanner club={club} />
        <ClubStatsSection clubId={clubId} initialStats={club.stats} />
        <AboutClubSection club={club} />
        <LearningTenureSection club={club} />
        {/* The sections below are member-only: non-members see a blurred
            "join to unlock" teaser, and the server withholds their data. */}
        {isMember ? (
          <WeeklyConnectsSection
            clubId={clubId}
            onViewSchedule={toggleCalendar}
            initialEvents={club.events}
          />
        ) : (
          <LockedSection
            clubId={clubId}
            title="Weekly Connects"
            variant="list"
            teaser="Join to see the club's recurring weekly sessions and never miss a connect."
            confirmationModalText={club.confirmationModalText}
          />
        )}
        {isMember ? (
          <ClubUpcomingSection
            clubId={clubId}
            onViewCalendar={toggleCalendar}
            initialEvents={club.events}
          />
        ) : (
          <LockedSection
            clubId={clubId}
            title="Live & Upcoming Events"
            variant="cards"
            teaser="Join to discover live and upcoming events happening in this club."
            confirmationModalText={club.confirmationModalText}
          />
        )}
        {isMember ? (
          <ClubPastSection clubId={clubId} initialEvents={club.events} />
        ) : (
          <LockedSection
            clubId={clubId}
            title="Past Events"
            variant="cards"
            teaser="Join to catch recaps and replays from the club's past events."
            confirmationModalText={club.confirmationModalText}
          />
        )}
        {isMember ? (
          <ClubLeaderboardSection
            clubId={clubId}
            initialLeaderboard={club.leaderboard}
          />
        ) : (
          <LockedSection
            clubId={clubId}
            title="Club Leaderboard"
            variant="list"
            teaser="Join to see how members rank and where you could land."
            confirmationModalText={club.confirmationModalText}
          />
        )}
        {isMember ? (
          <ClubDiscussionsSection
            clubId={clubId}
            discussions={club.discussions}
          />
        ) : (
          <LockedSection
            clubId={clubId}
            title="Club Discussion"
            variant="list"
            teaser="Join the conversation and see what members are discussing."
            confirmationModalText={club.confirmationModalText}
          />
        )}
        <ClubPhotosSection club={club} />
      </div>
    </InlineDrawer>
  )
}
