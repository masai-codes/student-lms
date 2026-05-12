'use client'

import { Bookmark } from 'lucide-react'

import { MasaiButton } from '@/components/ui/masai-button'
import { OLD_STUDENT_UI_NAV_PATHS } from '@/constants/oldStudentUiNavPaths'
import { getOldStudentUiUrlForPath } from '@/utils/authRedirect'

/** Default CTAs for lecture / assignment / resource detail headers. */
export function LearnDetailDefaultActions() {
  const openLegacySupport = () => {
    const url = getOldStudentUiUrlForPath(OLD_STUDENT_UI_NAV_PATHS.support)
    if (url) {
      window.location.assign(url)
      return
    }
    window.alert('Support is not available (legacy LMS URL is not configured).')
  }

  return (
    <>
      <MasaiButton
        type="secondary"
        size="md"
        ctaText="Raise Ticket"
        htmlType="button"
        onClick={openLegacySupport}
      />
      {/* Bookmark flow not wired yet. */}
      <MasaiButton
        type="tertiary"
        size="md"
        icon={<Bookmark strokeWidth={1.75} className="size-5" />}
        iconOnly
        htmlType="button"
        aria-label="Bookmark"
        onClick={() => undefined}
      />
    </>
  )
}
