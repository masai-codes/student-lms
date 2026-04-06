import { createFileRoute } from "@tanstack/react-router"
import HomeSection from "@/components/features/masaiverse/MasaiverseSections/HomeSection"
import EventsSection from "@/components/features/masaiverse/MasaiverseSections/EventsSection"
import LeaderboardSection from "@/components/features/masaiverse/MasaiverseSections/LeaderboardSection"
import ResourcesSection from "@/components/features/masaiverse/MasaiverseSections/ResourcesSection"

type MasaiverseTab = "home" | "events" | "leaderboard" | "resources"

export const Route = createFileRoute("/(protected)/_layout/masaiverse/")({
  validateSearch: (search): { tab: MasaiverseTab } => {
    const tab = search.tab
    if (
      tab === "home" ||
      tab === "events" ||
      tab === "leaderboard" ||
      tab === "resources"
    ) {
      return { tab }
    }
    return { tab: "home" }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { tab } = Route.useSearch()

  switch (tab) {
    case "events":
      return <EventsSection />
    case "leaderboard":
      return <LeaderboardSection />
    case "resources":
      return <ResourcesSection />
    default:
      return <HomeSection />
  }
}
