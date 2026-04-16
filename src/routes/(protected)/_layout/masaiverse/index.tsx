import { createFileRoute } from "@tanstack/react-router"
import HomeSection from "@/components/features/masaiverse/MasaiverseSections/HomeSection"
import EventsSection from "@/components/features/masaiverse/MasaiverseSections/EventsSection"
import LeaderboardSection from "@/components/features/masaiverse/MasaiverseSections/LeaderboardSection"
import ResourcesSection from "@/components/features/masaiverse/MasaiverseSections/ResourcesSection"

type MasaiverseTab = "home" | "events" | "leaderboard" | "resources"
type MasaiverseSearch = {
  tab: MasaiverseTab
  postId?: string
  createDiscussion?: boolean
}

export const Route = createFileRoute("/(protected)/_layout/masaiverse/")({
  validateSearch: (search): MasaiverseSearch => {
    const tab = search.tab
    const normalizedPostId =
      typeof search.postId === "string" || typeof search.postId === "number"
        ? String(search.postId)
        : undefined
    const normalizedCreateDiscussion =
      search.createDiscussion === true ||
      search.createDiscussion === 'true' ||
      search.createDiscussion === 1 ||
      search.createDiscussion === '1'
    if (
      tab === "home" ||
      tab === "events" ||
      tab === "leaderboard" ||
      tab === "resources"
    ) {
      return {
        tab,
        postId: normalizedPostId,
        createDiscussion: normalizedCreateDiscussion || undefined,
      }
    }
    return {
      tab: "home",
      postId: normalizedPostId,
      createDiscussion: normalizedCreateDiscussion || undefined,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { tab, postId, createDiscussion } = Route.useSearch()

  switch (tab) {
    case "events":
      return <EventsSection />
    case "leaderboard":
      return <LeaderboardSection />
    case "resources":
      return <ResourcesSection />
    default:
      return (
        <HomeSection
          postId={postId}
          shouldOpenCreateDiscussion={Boolean(createDiscussion)}
        />
      )
  }
}
