'use client'

import { useState } from 'react'
import { CardCtaButton } from '@/components/shared/card-cta-button'
import { learnEntityEvent, pushLearnEvent } from '../../shared/learnAnalytics'
import { fetchZoomRedirectUrlViaApi } from '@/lib/api/learn/zoomRedirectApi'
import { fetchAdaptiveJoinUrlViaApi } from '@/lib/api/learn/adaptiveJoinApi'
import { isAdaptiveLectureLink } from '@/server/learn/utils/toLectureScopedAdaptiveLink'
import { toast } from '@/lib/toast'
import { buildZoomWebViewUrl } from '@/lib/learn/zoomWebView'
import {
  getJoinLiveCtaTheme,
  shouldShowJoinLiveCta,
} from '@/lib/learn/listingCardPresentation'
import type { LearnListingJoinLiveState } from '@/server/learn/types'

type LearnListingJoinLiveCtaProps = {
  joinLive: LearnListingJoinLiveState
  /** Join URL (fallback for the ZEF flow); null when the session isn't near yet. */
  joinZoomLink: string | null
  /** When true, mint the join URL via the zoom-redirect API on click. */
  isNewZoomRedirection: boolean
  /** When true, open the old LMS embedded Zoom page instead of the raw link. */
  enableZoomWebView: boolean
  lectureId?: number
  title?: string
}

function openInNewTab(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function LearnListingJoinLiveCta({
  joinLive,
  joinZoomLink,
  isNewZoomRedirection,
  enableZoomWebView,
  lectureId,
  title,
}: LearnListingJoinLiveCtaProps) {
  const [pending, setPending] = useState(false)

  if (!shouldShowJoinLiveCta(joinLive)) {
    return null
  }

  const isActive = joinLive === 'active'

  const handleJoin = async () => {
    if (lectureId !== undefined) {
      pushLearnEvent(
        learnEntityEvent('lecture', 'join_live_click', lectureId),
        {
          lecture_id: lectureId,
          title,
          source: 'learn_listing',
          join_method: enableZoomWebView ? 'zoom_web_view' : 'zoom_link',
        },
      )
    }
    if (!isActive || pending) return

    // ZEF flow: mint a per-user redirect URL server-side, fall back to the raw
    // link. Otherwise open the (already lecture-scoped) join link directly.
    if (isNewZoomRedirection && lectureId !== undefined) {
      setPending(true)
      try {
        openInNewTab(await fetchZoomRedirectUrlViaApi(lectureId))
      } catch {
        if (joinZoomLink) openInNewTab(joinZoomLink)
        toast.error('Opened the standard join link instead.')
      } finally {
        setPending(false)
      }
      return
    }

    // SAL/adaptive: mint the join URL server-side so it carries a `?token=`
    // fallback and the tenant's experience-api host (iHub cookies aren't sent to
    // the masai host). Fall back to the raw scoped link (works for masai).
    if (isAdaptiveLectureLink(joinZoomLink) && lectureId !== undefined) {
      setPending(true)
      try {
        openInNewTab(await fetchAdaptiveJoinUrlViaApi(lectureId))
      } catch {
        if (joinZoomLink) openInNewTab(joinZoomLink)
        toast.error('Opened the standard join link instead.')
      } finally {
        setPending(false)
      }
      return
    }

    // Zoom Web View: reuse the old LMS embedded Zoom page (shared cookie).
    if (enableZoomWebView && lectureId !== undefined) {
      const webViewUrl = buildZoomWebViewUrl(lectureId)
      if (webViewUrl) {
        openInNewTab(webViewUrl)
        return
      }
    }

    if (joinZoomLink) openInNewTab(joinZoomLink)
  }

  return (
    <CardCtaButton
      text={pending ? 'Opening…' : 'Join Live'}
      theme={getJoinLiveCtaTheme(joinLive)}
      onClick={handleJoin}
      dataTestId="learn-listing-join-live-cta"
      className={
        joinLive === 'disabled' ? 'pointer-events-none opacity-60' : ''
      }
    />
  )
}
