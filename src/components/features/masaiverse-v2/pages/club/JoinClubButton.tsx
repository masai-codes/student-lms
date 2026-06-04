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
    mutationFn: () =>
      setMasaiverseV2ClubMembership({ clubId, join: !isJoined }),
    onSuccess: (state) => {
      queryClient.setQueryData<MasaiverseV2ClubDetail>(detailKey, (prev) =>
        prev
          ? {
              ...prev,
              isJoined: state.isJoined,
              memberCount: state.memberCount,
            }
          : prev,
      )
      // The sidebar "My Clubs" list now needs to gain/lose this club.
      void queryClient.invalidateQueries({ queryKey: MASAIVERSE_V2_MY_CLUBS_KEY })
    },
  })

  return (
    <button
      type="button"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      aria-pressed={isJoined}
      className={`flex items-center justify-center gap-2 rounded-[12px] px-5 py-2.5 text-[14px] font-bold transition-colors disabled:opacity-70 ${
        isJoined
          ? 'bg-masaiverse-orange text-white hover:bg-masaiverse-orange-dark'
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
