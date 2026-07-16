import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Plus } from '@phosphor-icons/react'
import type { MasaiverseV2ClubDetail } from '@/server/api/masaiverse-v2/services/getClubDetail.service'
import ConfirmActionModal from '@/components/features/masaiverse-v2/ConfirmActionModal'
import { setMasaiverseV2ClubMembership } from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import {
  MASAIVERSE_V2_MY_CLUBS_KEY,
  masaiverseV2ClubDetailQuery,
  masaiverseV2ClubEventsQuery,
  masaiverseV2ClubLeaderboardQuery,
  masaiverseV2ClubStatsQuery,
} from '@/query/masaiverse-v2/clubsQuery'
import {
  MASAIVERSE_EVENTS,
  trackMasaiverse,
} from '@/components/features/masaiverse-v2/tracking'

type JoinClubButtonProps = {
  clubId: string
  isJoined: boolean
  /**
   * `clubs.meta.confirmationModalText` — when set, clicking Join opens a
   * confirmation dialog with this markdown before the membership request.
   */
  confirmationModalText?: string | null
  /**
   * `onDark` (default) is the white pill used on the orange banner; `primary`
   * is the filled-orange pill for light surfaces such as the locked-section
   * unlock overlay.
   */
  variant?: 'onDark' | 'primary'
}

/** Per-variant classes for the not-yet-joined state. */
const VARIANT_STYLES = {
  onDark: 'bg-surface text-foreground hover:bg-surface/90',
  primary:
    'bg-accent-warm text-accent-warm-foreground shadow-sm hover:bg-accent-warm/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
} as const

export default function JoinClubButton({
  clubId,
  isJoined,
  confirmationModalText = null,
  variant = 'onDark',
}: JoinClubButtonProps) {
  const queryClient = useQueryClient()
  const detailKey = masaiverseV2ClubDetailQuery(clubId).queryKey
  // Whether the pre-join confirmation dialog is open. Only ever shown when the
  // club configures `confirmationModalText`.
  const [confirmOpen, setConfirmOpen] = useState(false)

  const mutation = useMutation({
    mutationFn: () => setMasaiverseV2ClubMembership({ clubId, join: true }),
    onSuccess: async (state) => {
      trackMasaiverse(MASAIVERSE_EVENTS.clubJoinSuccess, { club_id: clubId })
      setConfirmOpen(false)
      // The mutation response is authoritative — the server just performed the
      // join and returned the resulting membership. Apply it to the cache.
      const applyMembership = (prev?: MasaiverseV2ClubDetail) =>
        prev
          ? {
              ...prev,
              isJoined: state.isJoined,
              memberCount: state.memberCount,
            }
          : prev

      // Reflect the new membership immediately so the button flips to "Joined".
      queryClient.setQueryData<MasaiverseV2ClubDetail>(
        detailKey,
        applyMembership,
      )
      // Refetch everything scoped to this club. `detailKey` is the prefix of the
      // stats / events / leaderboard query keys, so a non-exact invalidate
      // refreshes the whole page (member count, active members, …) — not just
      // the detail payload — after the membership change.
      await queryClient.invalidateQueries({ queryKey: detailKey })
      // Re-assert the confirmed membership: the refetch above can race the
      // just-committed write and return a stale `isJoined: false`, which would
      // otherwise snap the button back to "Join" until a manual refresh.
      queryClient.setQueryData<MasaiverseV2ClubDetail>(
        detailKey,
        applyMembership,
      )
      // The member-only sections (events, leaderboard, stats) seed their own
      // queries from the detail payload's embedded data via `initialData`, which
      // is sticky after first mount. Flipping membership above mounts them with
      // the pre-join (server-withheld, empty) data, so they'd stay empty until a
      // manual refresh. Push the freshly refetched values into those caches now
      // that the user is a member.
      const fresh = queryClient.getQueryData<MasaiverseV2ClubDetail>(detailKey)
      if (fresh) {
        queryClient.setQueryData(
          masaiverseV2ClubEventsQuery(clubId).queryKey,
          fresh.events,
        )
        queryClient.setQueryData(
          masaiverseV2ClubLeaderboardQuery(clubId, 'overall').queryKey,
          fresh.leaderboard,
        )
        queryClient.setQueryData(
          masaiverseV2ClubStatsQuery(clubId).queryKey,
          fresh.stats,
        )
      }
      // The sidebar "My Clubs" list now needs to gain this club.
      void queryClient.invalidateQueries({
        queryKey: MASAIVERSE_V2_MY_CLUBS_KEY,
      })
    },
  })

  // Gate joining behind the confirmation dialog when the club provides notice
  // text; otherwise join straight away.
  const handleJoinClick = () => {
    if (isJoined) return
    trackMasaiverse(MASAIVERSE_EVENTS.clubJoinClick, {
      club_id: clubId,
      has_confirmation: Boolean(confirmationModalText),
    })
    if (confirmationModalText) setConfirmOpen(true)
    else mutation.mutate()
  }

  return (
    <>
      <button
        type="button"
        onClick={handleJoinClick}
        disabled={isJoined || mutation.isPending}
        aria-pressed={isJoined}
        className={`flex items-center justify-center gap-2 rounded-[12px] px-5 py-2.5 text-[14px] font-bold transition-all disabled:opacity-70 ${
          isJoined
            ? 'bg-accent-warm text-accent-warm-foreground'
            : VARIANT_STYLES[variant]
        }`}
      >
        {isJoined ? (
          <>
            <Check size={18} weight="bold" />
            Joined
          </>
        ) : (
          <>
            <Plus size={18} weight="bold" />
            Join
          </>
        )}
      </button>

      {confirmationModalText ? (
        <ConfirmActionModal
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          confirmationText={confirmationModalText}
          title="Confirm joining this club"
          confirmLabel={mutation.isPending ? 'Joining…' : 'Confirm & join'}
          isPending={mutation.isPending}
          onConfirm={() => mutation.mutate()}
        />
      ) : null}
    </>
  )
}
