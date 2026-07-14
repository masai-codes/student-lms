import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { UserSearchResult } from '@/server/api/masaiverse-v2/services/searchUsers.service'
import { Input } from '@/components/ui/input'
import { masaiverseV2UserSearchQuery } from '@/query/masaiverse-v2/leaderboardQuery'

/**
 * A small search-as-you-type picker for choosing the member to award. Once a
 * user is picked it collapses to a chip with a "Change" affordance.
 */
export default function UserSearchField({
  selected,
  onSelect,
}: {
  selected: UserSearchResult | null
  onSelect: (user: UserSearchResult | null) => void
}) {
  const [query, setQuery] = useState('')
  const { data: results = [], isFetching } = useQuery(
    masaiverseV2UserSearchQuery(query),
  )

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[12px] border border-border p-3">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-foreground">
            {selected.name}
          </p>
          <p className="truncate text-[12px] text-foreground-muted">
            {selected.email}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onSelect(null)
            setQuery('')
          }}
          className="shrink-0 text-[13px] font-semibold text-accent-warm"
        >
          Change
        </button>
      </div>
    )
  }

  const showResults = query.trim().length >= 2

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by name or email"
        aria-label="Search users"
      />
      {showResults ? (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-[12px] border border-border bg-surface py-1 shadow-lg">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-[13px] text-foreground-muted">
              {isFetching ? 'Searching…' : 'No users found'}
            </li>
          ) : (
            results.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  onClick={() => onSelect(user)}
                  className="block w-full px-3 py-2 text-left hover:bg-surface-muted"
                >
                  <span className="block truncate text-[14px] font-semibold text-foreground">
                    {user.name}
                  </span>
                  <span className="block truncate text-[12px] text-foreground-muted">
                    {user.email}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
