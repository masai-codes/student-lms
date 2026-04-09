import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Navigation } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import type { ClubType } from '@/server/masaiverse/fetchClubs'
import type { EventType } from '@/server/masaiverse/fetchEvents'
import { ClubCard } from '@/components/club-card'
import { EventCard } from '@/components/event-card'
import { Button } from '@/components/ui/button'
import {
  mapClubToCardProps,
  mapEventToCardProps,
} from '@/components/features/masaiverse/MasaiverseSections/cardDataMappers'
import CommunityDiscussions from '@/components/features/masaiverse/MasaiverseSections/CommunityDiscussions'
import { fetchMyClubMembership } from '@/server/masaiverse/fetchMyClubMembership'
import { fetchMyEventEnrollments } from '@/server/masaiverse/fetchMyEventEnrollments'
import { joinClub } from '@/server/masaiverse/joinClub'
import { joinEvent } from '@/server/masaiverse/joinEvent'
import { fetchAllClubs } from '@/server/masaiverse/fetchClubs'
import { fetchAllEvents } from '@/server/masaiverse/fetchEvents'
import 'swiper/css'
import 'swiper/css/navigation'

export default function HomeSection() {
  const navigate = useNavigate()
  const [clubsList, setClubsList] = useState<Array<ClubType>>([])
  const [eventsList, setEventsList] = useState<Array<EventType>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [joinedClubId, setJoinedClubId] = useState<string | null>(null)
  const [joiningClubId, setJoiningClubId] = useState<string | null>(null)
  const [enrolledEventIds, setEnrolledEventIds] = useState<Array<string>>([])
  const [joiningEventId, setJoiningEventId] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const getHomeData = async () => {
      try {
        const [clubs, events, membership, eventEnrollments] = await Promise.all([
          fetchAllClubs(),
          fetchAllEvents(),
          fetchMyClubMembership(),
          fetchMyEventEnrollments(),
        ])
        if (isMounted) {
          setClubsList(clubs)
          setEventsList(events)
          setJoinedClubId(membership?.joinedClubId ?? null)
          setEnrolledEventIds(eventEnrollments)
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
    const hasJoinedAnotherClub = Boolean(joinedClubId && joinedClubId !== clubId)
    if (hasJoinedAnotherClub || joiningClubId) {
      return
    }

    setJoiningClubId(clubId)
    try {
      const result = await joinClub({ data: { clubId } })
      if (result.success) {
        setJoinedClubId(result.joinedClubId)
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
      setEnrolledEventIds((prev) => (prev.includes(eventId) ? prev : [...prev, eventId]))
    } finally {
      setJoiningEventId(null)
    }
  }

  const orderedClubsList = joinedClubId
    ? [...clubsList].sort((a, b) => {
        if (a.id === joinedClubId) return -1
        if (b.id === joinedClubId) return 1
        return 0
      })
    : clubsList

  return (
    <section className="min-h-[400px] min-w-0 flex-1 overflow-x-hidden rounded-[16px] border border-[#E5E7EB] bg-[#fff] px-6 py-8">
      <h1 className="text-[24px] font-semibold text-[#111827]">Home</h1>
      <p className="mt-2 text-[14px] leading-6 text-[#6B7280]">
        Welcome to Masaiverse home. Explore clubs and join communities that
        match your interests.
      </p>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold text-[#111827]">Events</h2>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              navigate({
                to: '/masaiverse',
                search: { tab: 'events' },
              })
            }
          >
            View all
          </Button>
        </div>

        {isLoading ? (
          <p className="mt-3 text-sm text-[#6B7280]">Loading events...</p>
        ) : eventsList.length === 0 ? (
          <p className="mt-3 text-sm text-[#6B7280]">
            No events available right now.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {eventsList.slice(0, 3).map((event) => {
              const isEnrolled = enrolledEventIds.includes(event.id)
              const eventCardProps = mapEventToCardProps(event)
              const eventEndTime = event.endTime ? new Date(event.endTime).getTime() : Number.POSITIVE_INFINITY
              const isPastEvent = Number.isFinite(eventEndTime) && eventEndTime < Date.now()
              const isOfflineEvent = event.mode === 'offline'
              const enrolledRedirectLink = isOfflineEvent ? event.locationMapLink : event.eventLink
              const enrolledCtaText = isOfflineEvent ? 'View Location' : 'Open Link'
              return (
                <EventCard
                  key={event.id}
                  {...eventCardProps}
                  isActive={!isPastEvent && eventCardProps.isActive}
                  cardCtaText="View Details"
                  drawerCtaText={
                    isPastEvent
                      ? 'View Details'
                      : isEnrolled
                        ? enrolledRedirectLink
                          ? enrolledCtaText
                          : 'Enrolled'
                        : 'Enroll'
                  }
                  hideDrawerCta={isPastEvent}
                  onCtaClick={
                    isPastEvent
                      ? undefined
                      : isEnrolled
                        ? enrolledRedirectLink
                          ? () => {
                              window.open(enrolledRedirectLink, '_blank', 'noopener,noreferrer')
                            }
                          : undefined
                        : joiningEventId
                          ? undefined
                          : () => {
                              void handleEventEnroll(event.id)
                            }
                  }
                />
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-[18px] font-semibold text-[#111827]">Clubs</h2>

        {isLoading ? (
          <p className="mt-3 text-sm text-[#6B7280]">Loading clubs...</p>
        ) : clubsList.length === 0 ? (
          <p className="mt-3 text-sm text-[#6B7280]">
            No clubs available right now.
          </p>
        ) : (
          <div className="relative mt-4 overflow-hidden">
            <Swiper
              modules={[Navigation]}
              navigation={{
                prevEl: '.clubs-prev',
                nextEl: '.clubs-next',
              }}
              spaceBetween={16}
              slidesPerView="auto"
              className="w-full px-2 [&_.swiper-wrapper]:items-stretch [&_.swiper-slide]:!h-auto"
            >
              {orderedClubsList.map((club) => (
                <SwiperSlide key={club.id} className="!flex !h-auto !w-[300px]">
                  {(() => {
                    const clubCardProps = mapClubToCardProps(club)
                    const isJoinedClub = joinedClubId === club.id
                    const hasJoinedAnotherClub = Boolean(joinedClubId && !isJoinedClub)
                    const hasJoinedAtLeastOneClub = Boolean(joinedClubId)

                    return (
                      <div
                        className={`flex w-full ${
                          isJoinedClub || hasJoinedAnotherClub ? '[&_button]:pointer-events-none' : ''
                        } [&>div]:flex [&>div]:h-full [&>div]:w-full [&>div]:max-w-none [&>div]:flex-col`}
                      >
                        <ClubCard
                          {...clubCardProps}
                          shouldCompress={hasJoinedAtLeastOneClub}
                          showSuccessIcon={isJoinedClub}
                          ctaText={isJoinedClub ? 'Joined' : clubCardProps.ctaText}
                          cardCtaText={isJoinedClub ? 'Joined' : clubCardProps.ctaText}
                          drawerCtaText={isJoinedClub ? 'Joined' : clubCardProps.ctaText}
                          onCtaClick={
                            isJoinedClub || hasJoinedAnotherClub
                              ? undefined
                              : () => {
                                  void handleClubJoin(club.id)
                                }
                          }
                        />
                      </div>
                    )
                  })()}
                </SwiperSlide>
              ))}
            </Swiper>

            <div className="mt-4 flex justify-end gap-2 pr-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="clubs-prev rounded-full bg-white"
                aria-label="Previous clubs"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="clubs-next rounded-full bg-white"
                aria-label="Next clubs"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <CommunityDiscussions hasJoinedClub={Boolean(joinedClubId)} />
    </section>
  )
}
