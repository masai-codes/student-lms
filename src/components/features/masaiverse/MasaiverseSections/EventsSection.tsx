import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { fetchAllEvents } from "@/server/masaiverse/fetchEvents"
import type { EventType } from "@/server/masaiverse/fetchEvents"
import EventCard from "@/components/features/masaiverse/MasaiverseSections/EventCard"

type EventCategoryTab = "all" | "hackathon" | "meetup" | "webinar"

const EventsSection = () => {
  const [eventsList, setEventsList] = useState<EventType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<EventCategoryTab>("all")

  useEffect(() => {
    let isMounted = true

    const getEvents = async () => {
      try {
        const events = await fetchAllEvents()
        if (isMounted) {
          setEventsList(events)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    getEvents()

    return () => {
      isMounted = false
    }
  }, [])

  const categoryTabs = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(eventsList.map((event) => event.category).filter(Boolean))
    ) as Array<Exclude<EventType["category"], null>>

    return ["all", ...uniqueCategories] as EventCategoryTab[]
  }, [eventsList])

  const filteredEvents = useMemo(() => {
    if (activeCategory === "all") return eventsList
    return eventsList.filter((event) => event.category === activeCategory)
  }, [activeCategory, eventsList])

  return (
    <section className="min-h-[400px] min-w-0 flex-1 rounded-[16px] border border-[#E5E7EB] bg-[#fff] px-6 py-8">
      <h1 className="text-[24px] font-semibold text-[#111827]">Events</h1>
      <p className="mt-2 text-[14px] leading-6 text-[#6B7280]">
        Browse upcoming Masaiverse events, sessions, and community activities tailored for your learning journey.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {categoryTabs.map((category) => (
          <Button
            key={category}
            type="button"
            variant={activeCategory === category ? "default" : "outline"}
            className="capitalize"
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm text-[#6B7280]">Loading events...</p>
      ) : filteredEvents.length === 0 ? (
        <p className="mt-4 text-sm text-[#6B7280]">No events found for this category.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  )
}

export default EventsSection
