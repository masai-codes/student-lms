import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { ClubType } from '@/server/masaiverse/fetchClubs'
import type { EventType } from '@/server/masaiverse/fetchEvents'
import type { ScrollingBannerItem } from '@/components/scrolling-banner'
import { ScrollingBanner } from '@/components/scrolling-banner'
import CommunityDiscussions from '@/components/features/masaiverse/MasaiverseSections/CommunityDiscussions'
import HomeClubsCarousel from '@/components/features/masaiverse/MasaiverseSections/HomeSection/HomeClubsCarousel'
import HomeEventsPreview from '@/components/features/masaiverse/MasaiverseSections/HomeSection/HomeEventsPreview'
import HomeIntro from '@/components/features/masaiverse/MasaiverseSections/HomeSection/HomeIntro'
import { Route as ProtectedLayoutRoute } from '@/routes/(protected)/_layout/route'
import { fetchMyClubMembership } from '@/server/masaiverse/fetchMyClubMembership'
import { fetchMyEventEnrollments } from '@/server/masaiverse/fetchMyEventEnrollments'
import { fetchMasaiverseBanners } from '@/server/masaiverse/fetchMasaiverseBanners'
import { joinClub } from '@/server/masaiverse/joinClub'
import { joinEvent } from '@/server/masaiverse/joinEvent'
import { fetchAllClubs } from '@/server/masaiverse/fetchClubs'
import { fetchAllEvents } from '@/server/masaiverse/fetchEvents'
import { sendTrackingEvent } from '@/utils/tracking'
import 'swiper/css'
import 'swiper/css/navigation'

type HomeSectionProps = {
  postId?: string
  shouldOpenCreateDiscussion?: boolean
  initialDiscussionSearch?: string
  initialDiscussionPage?: number
}

export default function HomeSection({
  postId,
  shouldOpenCreateDiscussion = false,
  initialDiscussionSearch,
  initialDiscussionPage,
}: HomeSectionProps) {
  const { user } = ProtectedLayoutRoute.useRouteContext()
  const isAdmin =
    String(user.role ?? '')
      .trim()
      .toLowerCase() === 'admin'
  const navigate = useNavigate()
  const [clubsList, setClubsList] = useState<Array<ClubType>>([])
  const [eventsList, setEventsList] = useState<Array<EventType>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [joinedClubId, setJoinedClubId] = useState<string | null>(null)
  const [joiningClubId, setJoiningClubId] = useState<string | null>(null)
  const [clubJoinError, setClubJoinError] = useState<string | null>(null)
  const [enrolledEventIds, setEnrolledEventIds] = useState<Array<string>>([])
  const [joiningEventId, setJoiningEventId] = useState<string | null>(null)
  const [bannerItems, setBannerItems] = useState<Array<ScrollingBannerItem>>([])

  useEffect(() => {
    let isMounted = true

    const getHomeData = async () => {
      try {
        const [clubs, events, membership, eventEnrollments, banners] =
          await Promise.all([
            fetchAllClubs(),
            fetchAllEvents(),
            fetchMyClubMembership(),
            fetchMyEventEnrollments(),
            fetchMasaiverseBanners(),
          ])
        if (isMounted) {
          setClubsList(clubs)
          setEventsList(events)
          setJoinedClubId(membership?.joinedClubId ?? null)
          setEnrolledEventIds(eventEnrollments)
          setBannerItems(
            banners.map((banner) => ({
              id: banner.id,
              heading: banner.title,
              content: banner.description,
              ctaText: banner.ctaText,
              ctaLink: banner.ctaUrl,
            })),
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    getHomeData()

    return () => {
      isMounted = false
    }
  }, [])

  const handleClubJoin = async (clubId: string) => {
    const hasJoinedAnotherClub = Boolean(
      joinedClubId && joinedClubId !== clubId,
    )
    if (hasJoinedAnotherClub || joiningClubId) {
      return
    }

    setClubJoinError(null)
    setJoiningClubId(clubId)
    try {
      const result = await joinClub({ data: { clubId } })
      if (result.success) {
        const [membership, events] = await Promise.all([
          fetchMyClubMembership(),
          fetchAllEvents(),
        ])
        setJoinedClubId(membership?.joinedClubId ?? result.joinedClubId)
        setEventsList(events)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ''
      if (errorMessage.includes('ADMIN_CANNOT_JOIN_CLUB')) {
        setClubJoinError('Admins cannot join a club from Masaiverse.')
        return
      }

      setClubJoinError('Unable to join club right now. Please try again.')
    } finally {
      setJoiningClubId(null)
    }
  }

  const handleEventEnroll = async (eventId: string) => {
    if (joiningEventId || enrolledEventIds.includes(eventId)) {
      return
    }

    setJoiningEventId(eventId)
    try {
      await joinEvent({ data: { eventId } })
      setEnrolledEventIds((prev) =>
        prev.includes(eventId) ? prev : [...prev, eventId],
      )
    } finally {
      setJoiningEventId(null)
    }
  }

  const orderedClubsList = joinedClubId
    ? [...clubsList].sort((a, b) => {
        if (String(a.id) === joinedClubId) return -1
        if (String(b.id) === joinedClubId) return 1
        return 0
      })
    : clubsList
  const hasJoinedClub = Boolean(joinedClubId)

  return (
    <section className="min-w-0 flex-1 rounded-[16px] md:border border-[#E5E7EB] md:bg-[#fff] px-3 md:px-6 md:py-8 mb-[24px]">
      <HomeIntro />

      <div className="h-[1px] bg-[#E5E7EB] my-[8px] md:my-[16px]"></div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
        <div className="lg:col-span-7">
          <HomeEventsPreview
            isLoading={isLoading}
            eventsList={eventsList}
            enrolledEventIds={enrolledEventIds}
            joiningEventId={joiningEventId}
            userId={user?.id ? String(user.id) : null}
            onViewAll={() => {
              sendTrackingEvent({
                event: 'masaiverse_events_view_all_click',
                source: 'home_events_preview',
              })
              navigate({
                to: '/masaiverse',
                search: (prev) => ({
                  ...prev,
                  tab: 'events',
                }),
              })
            }}
            onEventEnroll={(eventId) => {
              void handleEventEnroll(eventId)
            }}
            onEventViewDetails={(eventId) => {
              sendTrackingEvent({
                event: 'masaiverse_events_view_details_click',
                source: 'home_events_preview',
                event_id: eventId,
              })
            }}
            onEventDrawerCtaClick={(eventId, action) => {
              sendTrackingEvent({
                event: 'masaiverse_events_drawer_cta_click',
                source: 'home_events_preview',
                cta_type: action,
                event_id: eventId,
              })
            }}
          />
          {!hasJoinedClub && (
            <>
              <HomeClubsCarousel
                isLoading={isLoading}
                clubsList={clubsList}
                orderedClubsList={orderedClubsList}
                joinedClubId={joinedClubId}
                onClubJoin={(clubId) => {
                  void handleClubJoin(clubId)
                }}
                onClubViewDetails={(clubId) => {
                  sendTrackingEvent({
                    event: 'masaiverse_clubs_view_details_click',
                    source: 'home_clubs_carousel',
                    club_id: clubId,
                    membership_state: joinedClubId === clubId ? 'joined' : 'not_joined',
                  })
                }}
                onClubDrawerCtaClick={(clubId) => {
                  sendTrackingEvent({
                    event: 'masaiverse_clubs_drawer_cta_click',
                    source: 'home_clubs_carousel',
                    cta_type: 'join',
                    club_id: clubId,
                  })
                }}
              />
              {clubJoinError && (
                <p className="mt-2 text-sm text-[#DC2626]">{clubJoinError}</p>
              )}
            </>
          )}
          <CommunityDiscussions
            hasJoinedClub={hasJoinedClub}
            isAdmin={isAdmin}
            clubs={clubsList}
            joinedClubId={joinedClubId}
            initialPostIdFromSearch={postId}
            initialCreateDiscussionOpen={shouldOpenCreateDiscussion}
            initialDiscussionSearch={initialDiscussionSearch}
            initialDiscussionPage={initialDiscussionPage}
          />
        </div>

        <aside className="lg:col-span-3">
          <ScrollingBanner
            items={bannerItems}
            onShowMoreClick={(item) => {
              sendTrackingEvent({
                event: 'masaiverse_banner_show_more_click',
                banner_id: String(item.id ?? ''),
                banner_heading: item.heading ?? '',
              })
            }}
            onCtaClick={(item) => {
              sendTrackingEvent({
                event: 'masaiverse_banner_cta_click',
                banner_id: String(item.id ?? ''),
                banner_heading: item.heading ?? '',
                cta_text: item.ctaText ?? '',
              })
            }}
            maxHeight={300}
            itemDurationSeconds={3.5}
            autoScroll={false}
            ariaLabel="Masaiverse banners"
            bannerHeading="Last week on Masaiverse"
          />
          {hasJoinedClub && (
            <>
              <HomeClubsCarousel
                isLoading={isLoading}
                clubsList={clubsList}
                orderedClubsList={orderedClubsList}
                joinedClubId={joinedClubId}
                onClubJoin={(clubId) => {
                  void handleClubJoin(clubId)
                }}
                onClubViewDetails={(clubId) => {
                  sendTrackingEvent({
                    event: 'masaiverse_clubs_view_details_click',
                    source: 'joined_club_panel',
                    club_id: clubId,
                    membership_state: joinedClubId === clubId ? 'joined' : 'not_joined',
                  })
                }}
                onClubDrawerCtaClick={(clubId) => {
                  sendTrackingEvent({
                    event: 'masaiverse_clubs_drawer_cta_click',
                    source: 'joined_club_panel',
                    cta_type: 'join',
                    club_id: clubId,
                  })
                }}
                className="mt-6"
                singleSlideOnly
              />
              {clubJoinError && (
                <p className="mt-2 text-sm text-[#DC2626]">{clubJoinError}</p>
              )}
            </>
          )}
        </aside>
      </div>
    </section>
  )
}
