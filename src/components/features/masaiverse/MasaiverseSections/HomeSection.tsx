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
import { fetchMyClubMembership } from '@/server/masaiverse/fetchMyClubMembership'
import { fetchMyEventEnrollments } from '@/server/masaiverse/fetchMyEventEnrollments'
import { fetchMasaiverseBanners } from '@/server/masaiverse/fetchMasaiverseBanners'
import { joinClub } from '@/server/masaiverse/joinClub'
import { joinEvent } from '@/server/masaiverse/joinEvent'
import { fetchAllClubs } from '@/server/masaiverse/fetchClubs'
import { fetchAllEvents } from '@/server/masaiverse/fetchEvents'
import 'swiper/css'
import 'swiper/css/navigation'

type HomeSectionProps = {
  postId?: string
  shouldOpenCreateDiscussion?: boolean
}

export default function HomeSection({
  postId,
  shouldOpenCreateDiscussion = false,
}: HomeSectionProps) {
  const navigate = useNavigate()
  const [clubsList, setClubsList] = useState<Array<ClubType>>([])
  const [eventsList, setEventsList] = useState<Array<EventType>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [joinedClubId, setJoinedClubId] = useState<string | null>(null)
  const [joiningClubId, setJoiningClubId] = useState<string | null>(null)
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

  return (
    <section className="min-h-[max(400px,calc(100dvh-11rem))] min-w-0 flex-1 overflow-x-hidden rounded-[16px] md:border border-[#E5E7EB] md:bg-[#fff] px-3 md:px-6 md:py-8 mb-[24px]">
      <HomeIntro />

      <div className="h-[1px] bg-[#E5E7EB] my-[8px] md:my-[16px]"></div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
        <div className="lg:col-span-7">
          <HomeEventsPreview
            isLoading={isLoading}
            eventsList={eventsList}
            enrolledEventIds={enrolledEventIds}
            joiningEventId={joiningEventId}
            onViewAll={() =>
              navigate({
                to: '/masaiverse',
                search: { tab: 'events' },
              })
            }
            onEventEnroll={(eventId) => {
              void handleEventEnroll(eventId)
            }}
          />
          <HomeClubsCarousel
            isLoading={isLoading}
            clubsList={clubsList}
            orderedClubsList={orderedClubsList}
            joinedClubId={joinedClubId}
            onClubJoin={(clubId) => {
              void handleClubJoin(clubId)
            }}
          />

          <CommunityDiscussions
            hasJoinedClub={Boolean(joinedClubId)}
            initialPostIdFromSearch={postId}
            initialCreateDiscussionOpen={shouldOpenCreateDiscussion}
          />
        </div>

        <aside className="lg:col-span-3">
          <ScrollingBanner
            items={bannerItems}
            maxHeight={300}
            itemDurationSeconds={3.5}
            autoScroll={false}
            ariaLabel="Masaiverse banners"
            bannerHeading="Last week on Masaiverse"
          />
        </aside>
      </div>
    </section>
  )
}
