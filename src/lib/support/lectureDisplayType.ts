import type { SupportLectureDisplayType } from '@/server/api/support/support.types'

export type { SupportLectureDisplayType }

export function toSupportLectureDisplayType(
  rawType: string,
): SupportLectureDisplayType | undefined {
  const normalized = rawType.trim().toLowerCase()
  if (normalized === 'live') return 'live'
  if (normalized === 'video') return 'video'
  if (normalized === 'scrum') return 'scrum'
  return undefined
}

export function formatSupportLectureDisplayTypeLabel(
  type: SupportLectureDisplayType | undefined,
): string | null {
  if (type === 'live') return 'Live'
  if (type === 'video') return 'Video'
  if (type === 'scrum') return 'Scrum'
  return null
}

export function supportLectureDisplayTypeChipClassName(
  type: SupportLectureDisplayType | undefined,
): string {
  if (type === 'live')
    return 'text-[#b42318] bg-[#fee4e2] dark:text-danger-subtle-foreground dark:bg-danger-subtle'
  if (type === 'video')
    return 'text-[#175cd3] bg-[#d1e9ff] dark:text-info-subtle-foreground dark:bg-info-subtle'
  if (type === 'scrum')
    return 'text-[#b54708] bg-[#fffaeb] dark:text-warning-subtle-foreground dark:bg-warning-subtle'
  return 'text-[#4338ca] bg-[#e3e3fb] dark:text-brand-subtle-foreground dark:bg-brand-subtle'
}
