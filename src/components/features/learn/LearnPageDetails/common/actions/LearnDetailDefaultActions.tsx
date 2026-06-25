'use client'

import { Bookmark } from 'lucide-react'

import { MasaiButton } from '@/components/ui/masai-button'
import { OLD_STUDENT_UI_NAV_PATHS } from '@/constants/oldStudentUiNavPaths'
import { getOldStudentUiUrlForPath } from '@/utils/authRedirect'

export interface LearnDetailBookmarkControls {
  isBookmarked: boolean
  pending: boolean
  toggle: () => void
}

type LearnDetailDefaultActionsProps = {
  /** When provided, renders a wired bookmark toggle; otherwise the button is inert. */
  bookmark?: LearnDetailBookmarkControls
}

/** Default CTAs for lecture / assignment / resource detail headers. */
export function LearnDetailDefaultActions({
  bookmark,
}: LearnDetailDefaultActionsProps = {}) {
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
      <MasaiButton
        type="tertiary"
        size="md"
        icon={
          <Bookmark
            strokeWidth={1.75}
            className="size-5"
            fill={bookmark?.isBookmarked ? 'currentColor' : 'none'}
          />
        }
        iconOnly
        htmlType="button"
        aria-label={bookmark?.isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        aria-pressed={bookmark ? bookmark.isBookmarked : undefined}
        disabled={bookmark?.pending}
        onClick={bookmark ? bookmark.toggle : () => undefined}
      />
    </>
  )
}
