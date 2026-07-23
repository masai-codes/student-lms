import { ApiClientError } from '@/lib/api/apiClientError'
import type { SupportEntityCategory } from '@/server/api/support/support.types'

const ENTITY_TYPE_LABEL: Record<SupportEntityCategory, string> = {
  lecture: 'Lecture',
  assignment: 'Assignment',
  resource: 'Resource',
  evaluation: 'Evaluation',
}

export type EntityLaunchFailureReason = 'api_error' | 'batch_unknown'

function entityLabel(category: SupportEntityCategory, entityId: number): string {
  return `${ENTITY_TYPE_LABEL[category]} #${entityId}`
}

/** Maps API / client failures into a student-friendly launch error message. */
export function getEntityLaunchErrorMessage(input: {
  error?: unknown
  reason?: EntityLaunchFailureReason
  category?: SupportEntityCategory
  entityId?: number
}): string {
  const label =
    input.category != null && input.entityId != null
      ? entityLabel(input.category, input.entityId)
      : 'This item'

  if (input.reason === 'batch_unknown') {
    return `${label} belongs to a course that isn't available in your support inbox. Raise a ticket manually and pick your course.`
  }

  if (input.error instanceof ApiClientError) {
    switch (input.error.code) {
      case 'SUPPORT_LECTURE_NOT_FOUND':
        return `${label} couldn't be found, or you don't have access to it.`
      case 'SUPPORT_RESOURCE_NOT_FOUND':
        return `${label} couldn't be found, or you don't have access to it.`
      case 'SUPPORT_ASSIGNMENT_NOT_FOUND':
        return `${label} couldn't be found, or you don't have access to it.`
      case 'SUPPORT_ENTITY_BATCH_NOT_FOUND':
        return `We couldn't link ${label} to your course batch.`
      case 'SUPPORT_INVALID_ENTITY_CATEGORY':
        return 'This support link has an invalid category. Check the link and try again.'
      case 'SUPPORT_INVALID_ENTITY_ID':
        return 'This support link has an invalid item id. Check the link and try again.'
      default:
        break
    }
  }

  return `We couldn't open support for ${label}. Please try again or continue without this item.`
}
