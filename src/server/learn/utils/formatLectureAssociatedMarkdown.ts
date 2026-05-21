import type { LectureAssociatedListItem } from '@/server/learn/lectureAssociatedTypes'

export function formatLectureAssociatedMarkdown(
  items: Array<LectureAssociatedListItem>,
): string | null {
  if (items.length === 0) return null

  const lectures = items.filter(item => item.kind === 'lecture')
  const assignmentItems = items.filter(item => item.kind === 'assignment')

  const lines: Array<string> = []

  if (lectures.length > 0) {
    lines.push('**Associated lectures**')
    for (const item of lectures) {
      lines.push(
        item.meta != null ? `- ${item.title} (${item.meta})` : `- ${item.title}`,
      )
    }
  }

  if (assignmentItems.length > 0) {
    if (lines.length > 0) lines.push('')
    lines.push('**Associated assignments**')
    for (const item of assignmentItems) {
      lines.push(
        item.meta != null ? `- ${item.title} (${item.meta})` : `- ${item.title}`,
      )
    }
  }

  return lines.join('\n')
}
