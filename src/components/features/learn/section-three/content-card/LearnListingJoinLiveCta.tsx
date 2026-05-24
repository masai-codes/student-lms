import { CardCtaButton } from '@/components/shared/card-cta-button'
import {
  getJoinLiveCtaTheme,
  shouldShowJoinLiveCta,
} from '@/lib/learn/listingCardPresentation'
import type { LearnListingJoinLiveState } from '@/server/learn/types'

type LearnListingJoinLiveCtaProps = {
  joinLive: LearnListingJoinLiveState
}

export function LearnListingJoinLiveCta({ joinLive }: LearnListingJoinLiveCtaProps) {
  if (!shouldShowJoinLiveCta(joinLive)) {
    return null
  }

  return (
    <CardCtaButton
      text="Join Live"
      theme={getJoinLiveCtaTheme(joinLive)}
      className={joinLive === 'disabled' ? 'pointer-events-none opacity-60' : ''}
    />
  )
}
