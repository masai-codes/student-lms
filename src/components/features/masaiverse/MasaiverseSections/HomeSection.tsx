import { useEffect, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Navigation } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"
import type { ClubType } from "@/server/masaiverse/fetchClubs"
import type { EventType } from "@/server/masaiverse/fetchEvents"
import type { JoinableItem } from "@/components/features/masaiverse/MasaiverseSections/JoinDetailsSheet"
import { Button } from "@/components/ui/button"
import EventCard from "@/components/features/masaiverse/MasaiverseSections/EventCard"
import JoinDetailsSheet from "@/components/features/masaiverse/MasaiverseSections/JoinDetailsSheet"
import { fetchAllClubs } from "@/server/masaiverse/fetchClubs"
import { fetchAllEvents } from "@/server/masaiverse/fetchEvents"
import "swiper/css"
import "swiper/css/navigation"

export default function HomeSection() {
  const navigate = useNavigate()
  const [clubsList, setClubsList] = useState<Array<ClubType>>([])
  const [eventsList, setEventsList] = useState<Array<EventType>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<JoinableItem>(null)

  useEffect(() => {
    let isMounted = true

    const getHomeData = async () => {
      try {
        const [clubs, events] = await Promise.all([fetchAllClubs(), fetchAllEvents()])
        if (isMounted) {
          setClubsList(clubs)
          setEventsList(events)
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

  return (
    <section className="min-h-[400px] min-w-0 flex-1 overflow-x-hidden rounded-[16px] border border-[#E5E7EB] bg-[#fff] px-6 py-8">
      <h1 className="text-[24px] font-semibold text-[#111827]">Home</h1>
      <p className="mt-2 text-[14px] leading-6 text-[#6B7280]">
        Welcome to Masaiverse home. Explore clubs and join communities that match your interests.
      </p>

      <div className="mt-6">
        <h2 className="text-[18px] font-semibold text-[#111827]">Clubs</h2>

        {isLoading ? (
          <p className="mt-3 text-sm text-[#6B7280]">Loading clubs...</p>
        ) : clubsList.length === 0 ? (
          <p className="mt-3 text-sm text-[#6B7280]">No clubs available right now.</p>
        ) : (
          <div className="relative mt-4 overflow-hidden">
            <Swiper
              modules={[Navigation]}
              navigation={{
                prevEl: ".clubs-prev",
                nextEl: ".clubs-next",
              }}
              spaceBetween={16}
              slidesPerView="auto"
              className="w-full px-2"
            >
              {clubsList.map((club) => (
                <SwiperSlide key={club.id} className="!w-[246px]">
                  <article className="h-full w-full rounded-xl border border-[#E5E7EB] bg-white p-4">
                    <img
                      src={club.image || "/Masaiverse.svg"}
                      alt={club.name}
                      className="h-36 w-full rounded-lg object-cover"
                    />

                    <p className="mt-3 text-lg font-semibold text-[#111827]">{club.name}</p>
                    <p className="mt-1 text-sm font-medium text-[#4B5563]">{club.domain || "General"}</p>
                    <p className="mt-2 min-h-10 text-sm leading-5 text-[#6B7280]">
                      {club.meta?.mini_description || "No description available."}
                    </p>

                    <Button className="mt-4 w-full" onClick={() => setSelectedItem({ type: "club", data: club })}>
                      Join
                    </Button>
                  </article>
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

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold text-[#111827]">Events</h2>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              navigate({
                to: "/masaiverse",
                search: { tab: "events" },
              })
            }
          >
            View all
          </Button>
        </div>

        {isLoading ? (
          <p className="mt-3 text-sm text-[#6B7280]">Loading events...</p>
        ) : eventsList.length === 0 ? (
          <p className="mt-3 text-sm text-[#6B7280]">No events available right now.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {eventsList
              .slice(0, 3)
              .map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onJoin={(eventData) => setSelectedItem({ type: "event", data: eventData })}
                />
              ))}
          </div>
        )}
      </div>

      <JoinDetailsSheet selectedItem={selectedItem} onClose={() => setSelectedItem(null)} />
    </section>
  )
}
