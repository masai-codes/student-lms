import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Plus } from '@phosphor-icons/react'
import type { MasaiverseV2ClubDetail } from '@/server/api/masaiverse-v2/services/getClubDetail.service'
import ConfirmActionModal from '@/components/features/masaiverse-v2/ConfirmActionModal'
import { setMasaiverseV2ClubMembership } from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import {
  MASAIVERSE_V2_MY_CLUBS_KEY,
  masaiverseV2ClubDetailQuery,
} from '@/query/masaiverse-v2/clubsQuery'

type JoinClubButtonProps = {
  clubId: string
  isJoined: boolean
  /**
   * `clubs.meta.confirmationModalText` — when set, clicking Join opens a
   * confirmation dialog with this markdown before the membership request.
   */
  confirmationModalText?: string | null
}

export default function JoinClubButton({
  clubId,
  isJoined,
  confirmationModalText = null,
}: JoinClubButtonProps) {
  const queryClient = useQueryClient()
  const detailKey = masaiverseV2ClubDetailQuery(clubId).queryKey
  // Whether the pre-join confirmation dialog is open. Only ever shown when the
  // club configures `confirmationModalText`.
  const [confirmOpen, setConfirmOpen] = useState(false)

  const mutation = useMutation({
    mutationFn: () => setMasaiverseV2ClubMembership({ clubId, join: true }),
    onSuccess: async (state) => {
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
      queryClient.setQueryData<MasaiverseV2ClubDetail>(detailKey, applyMembership)
      // Refetch everything scoped to this club. `detailKey` is the prefix of the
      // stats / events / leaderboard query keys, so a non-exact invalidate
      // refreshes the whole page (member count, active members, …) — not just
      // the detail payload — after the membership change.
      await queryClient.invalidateQueries({ queryKey: detailKey })
      // Re-assert the confirmed membership: the refetch above can race the
      // just-committed write and return a stale `isJoined: false`, which would
      // otherwise snap the button back to "Join" until a manual refresh.
      queryClient.setQueryData<MasaiverseV2ClubDetail>(detailKey, applyMembership)
      // The sidebar "My Clubs" list now needs to gain this club.
      void queryClient.invalidateQueries({ queryKey: MASAIVERSE_V2_MY_CLUBS_KEY })
    },
  })

  // Gate joining behind the confirmation dialog when the club provides notice
  // text; otherwise join straight away.
  const handleJoinClick = () => {
    if (isJoined) return
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
        className={`flex items-center justify-center gap-2 rounded-[12px] px-5 py-2.5 text-[14px] font-bold transition-colors disabled:opacity-70 ${
          isJoined
            ? 'bg-masaiverse-orange text-white'
            : 'bg-white text-[#111827] hover:bg-white/90'
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
