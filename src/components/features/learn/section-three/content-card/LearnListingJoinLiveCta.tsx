import { CardCtaButton } from '@/components/shared/card-cta-button'
import { learnEntityEvent, pushLearnEvent } from '../../shared/learnAnalytics'
import {
  getJoinLiveCtaTheme,
  shouldShowJoinLiveCta,
} from '@/lib/learn/listingCardPresentation'
import type { LearnListingJoinLiveState } from '@/server/learn/types'

type LearnListingJoinLiveCtaProps = {
  joinLive: LearnListingJoinLiveState
  lectureId?: number
  title?: string
}

export function LearnListingJoinLiveCta({
  joinLive,
  lectureId,
  title,
}: LearnListingJoinLiveCtaProps) {
  if (!shouldShowJoinLiveCta(joinLive)) {
    return null
  }

  return (
    <CardCtaButton
      text="Join Live"
      theme={getJoinLiveCtaTheme(joinLive)}
      onClick={() => {
        if (lectureId === undefined) return
        pushLearnEvent(learnEntityEvent('lecture', 'join_live_click', lectureId), {
          lecture_id: lectureId,
          title,
          source: 'learn_listing',
        })
      }}
      className={joinLive === 'disabled' ? 'pointer-events-none opacity-60' : ''}
    />
  )
}
