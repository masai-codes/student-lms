import { createFileRoute } from "@tanstack/react-router"
import { MasaiVerseHomepage } from "@/components/features/masaiverse"

export const Route = createFileRoute("/(protected)/_layout/masaiverse/")({
  component: RouteComponent,
})

function RouteComponent() {
  return <MasaiVerseHomepage />
}
