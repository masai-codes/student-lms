import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import UserSearchField from './UserSearchField'
import type { UserSearchResult } from '@/server/api/masaiverse-v2/services/searchUsers.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { awardMasaiverseV2Points } from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import { masaiverseV2MyClubsQuery } from '@/query/masaiverse-v2/clubsQuery'
import { MASAIVERSE_EVENTS, trackMasaiverse } from '../../tracking'

const NO_CLUB = 'none'

/** The dropdown value `none` means community-wide; otherwise it is a club id. */
export function resolveClubId(clubId: string): string | null {
  return clubId === NO_CLUB ? null : clubId
}

/**
 * Leaderboard query keys to refetch after an award: always the global board,
 * plus the chosen club's subtree (detail + its leaderboard) when one was picked.
 */
export function pointsInvalidationKeys(
  clubId: string,
): Array<ReadonlyArray<string>> {
  const keys: Array<ReadonlyArray<string>> = [
    ['masaiverse-v2', 'global-leaderboard'],
  ]
  if (clubId !== NO_CLUB) keys.push(['masaiverse-v2', 'club', clubId])
  return keys
}

/**
 * Admin form to hand-assign leaderboard points to a member, optionally scoped to
 * a club. On success it refetches the global board (and the club's board when
 * one is chosen) so the new points show immediately, then closes via `onDone`.
 */
export default function AssignPointsForm({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient()
  const { data: clubs = [] } = useQuery(masaiverseV2MyClubsQuery())
  const [user, setUser] = useState<UserSearchResult | null>(null)
  const [points, setPoints] = useState('')
  const [clubId, setClubId] = useState<string>(NO_CLUB)

  const pointsValue = Number(points)
  const canSubmit =
    user != null &&
    points.trim() !== '' &&
    Number.isInteger(pointsValue) &&
    pointsValue !== 0

  const mutation = useMutation({
    mutationFn: () =>
      awardMasaiverseV2Points({
        targetUserId: user!.id,
        points: pointsValue,
        clubId: resolveClubId(clubId),
      }),
    onSuccess: () => {
      trackMasaiverse(MASAIVERSE_EVENTS.pointsAssign, {
        target_user_id: user?.id,
        points: pointsValue,
        club_id: resolveClubId(clubId),
      })
      pointsInvalidationKeys(clubId).forEach((queryKey) => {
        void queryClient.invalidateQueries({ queryKey })
      })
      onDone()
    },
  })

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (canSubmit) mutation.mutate()
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label>User</Label>
        <UserSearchField selected={user} onSelect={setUser} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="assign-points">Points</Label>
        <Input
          id="assign-points"
          type="number"
          value={points}
          onChange={(event) => setPoints(event.target.value)}
          placeholder="e.g. 50 (use a negative value to deduct)"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Club (optional)</Label>
        <Select value={clubId} onValueChange={setClubId}>
          <SelectTrigger aria-label="Club">
            <SelectValue />
          </SelectTrigger>
          {/* Lift above the modal (z-[300]); the default z-50 sits behind it. */}
          <SelectContent className="z-[400]">
            <SelectItem value={NO_CLUB}>No club (community-wide)</SelectItem>
            {clubs.map((club) => (
              <SelectItem key={club.id} value={club.id}>
                {club.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {mutation.isError ? (
        <p className="text-[13px] text-red-600">
          Couldn&apos;t assign points. Please try again.
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit || mutation.isPending}>
          {mutation.isPending ? 'Assigning…' : 'Assign points'}
        </Button>
      </div>
    </form>
  )
}
