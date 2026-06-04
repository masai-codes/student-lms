import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Plus } from '@phosphor-icons/react'
import type { MasaiverseV2ClubDetail } from '@/server/api/masaiverse-v2/services/getClubDetail.service'
import { setMasaiverseV2ClubMembership } from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import {
  MASAIVERSE_V2_MY_CLUBS_KEY,
  masaiverseV2ClubDetailQuery,
} from '@/query/masaiverse-v2/clubsQuery'

type JoinClubButtonProps = {
  clubId: string
  isJoined: boolean
}

export default function JoinClubButton({ clubId, isJoined }: JoinClubButtonProps) {
  const queryClient = useQueryClient()
  const detailKey = masaiverseV2ClubDetailQuery(clubId).queryKey

  const mutation = useMutation({
    mutationFn: () => setMasaiverseV2ClubMembership({ clubId, join: true }),
    onSuccess: async (state) => {
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
      // Refetch the club detail API so the page shows fully refreshed data
      // (e.g. member list). `exact` keeps it to the detail query.
      await queryClient.invalidateQueries({ queryKey: detailKey, exact: true })
      // Re-assert the confirmed membership: the refetch above can race the
      // just-committed write and return a stale `isJoined: false`, which would
      // otherwise snap the button back to "Join" until a manual refresh.
      queryClient.setQueryData<MasaiverseV2ClubDetail>(detailKey, applyMembership)
      // The sidebar "My Clubs" list now needs to gain this club.
      void queryClient.invalidateQueries({ queryKey: MASAIVERSE_V2_MY_CLUBS_KEY })
    },
  })

  return (
    <button
      type="button"
      onClick={() => {
        if (!isJoined) mutation.mutate()
      }}
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
  )
}
