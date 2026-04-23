import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { fetchAllClubs } from "@/server/masaiverse/fetchClubs"

type Club = {
  id: string
  name: string
  domain: string | null
}

export const Route = createFileRoute("/test")({
  component: RouteComponent,
})

function RouteComponent() {
  const [clubs, setClubs] = useState<Array<Club>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getClubData = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await fetchAllClubs()
      if (!Array.isArray(result)) {
        throw new Error("Invalid clubs response")
      }
      const normalizedClubs = result.map((club) => ({
        id: String(club.id),
        name: String(club.name),
        domain: club.domain ? String(club.domain) : null,
      }))
      setClubs(normalizedClubs)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch clubs")
      setClubs([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Public Test Page</h1>
      <p className="mt-2 text-sm text-gray-600">
        This page is public and does not require login.
      </p>

      <button
        type="button"
        onClick={getClubData}
        disabled={loading}
        className="mt-5 rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
      >
        {loading ? "Loading..." : "Get Club Data"}
      </button>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {Array.isArray(clubs) && clubs.length > 0 ? (
        <div className="mt-6 space-y-3">
          {clubs.map((club) => (
            <div key={club.id} className="rounded border p-3">
              <p className="font-medium">ID: {club.id}</p>
              <p className="text-sm">Name: {club.name}</p>
              <p className="text-sm">Domain: {club.domain ?? "-"}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
