import type { LectureSharedResource } from '@/server/api/ai-tutor/services/parseLectureZoomChatResources'

export function formatLectureSharedResourcesForPrompt(
  resources: Array<LectureSharedResource>,
): string {
  if (resources.length === 0) {
    return 'No resources were shared during the lecture.'
  }

  return resources
    .map((resource) => {
      const parts = [resource.url]
      const meta: Array<string> = []

      if (resource.timestamp) meta.push(`at ${resource.timestamp}`)
      if (resource.postedBy) meta.push(`by ${resource.postedBy}`)
      if (resource.count != null) meta.push(`shared ${resource.count} time(s)`)
      if (resource.resolvedTo) meta.push(`resolved to ${resource.resolvedTo}`)

      if (meta.length > 0) {
        parts.push(`(${meta.join(', ')})`)
      }

      return `- ${parts.join(' ')}`
    })
    .join('\n')
}
