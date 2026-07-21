import type { NavigateOptions } from '@tanstack/react-router'

type SupportNavigate = (options: NavigateOptions) => void

/** Same-tab navigation for learn item deep-links from the support floater. */
export function navigateSupportReviewHref(navigate: SupportNavigate, href: string): void {
  const lectureMatch = href.match(/^\/lectures\/(\d+)$/)
  if (lectureMatch) {
    void navigate({
      to: '/lectures/$lectureId',
      params: { lectureId: lectureMatch[1] },
    })
    return
  }

  const assignmentMatch = href.match(/^\/assignments\/(\d+)$/)
  if (assignmentMatch) {
    void navigate({
      to: '/assignments/$assignmentId',
      params: { assignmentId: assignmentMatch[1] },
    })
    return
  }

  const resourceMatch = href.match(/^\/resources\/(\d+)$/)
  if (resourceMatch) {
    void navigate({
      to: '/resources/$resourceId',
      params: { resourceId: resourceMatch[1] },
    })
  }
}
