import type { AssignmentKind } from '@/server/learn/assignmentDetailTypes'
import { getAssignmentTypeNoun } from '@/server/learn/utils/getAssignmentTypeNoun'
import { isAssessmentPlatform } from '@/server/learn/utils/assignmentPlatform'

export type AssignmentEmptyInstructionsInput = {
  assignmentKind: AssignmentKind
  platform: string | null
  isExpired: boolean
  submission: {
    completed: boolean
    data: Record<string, unknown> | null
  } | null
}

function hasAssessPlatformLink(data: Record<string, unknown> | null): boolean {
  const link = data?.assess_platform_link
  return typeof link === 'string' && link.trim() !== ''
}

/**
 * Copy shown in the Instructions panel when an assignment has no instructions.
 * Mirrors the old LMS exactly (Assignment-Deatils-Page-oj-page): the
 * "You can start … below." variant appears only on an Assessment Platform
 * item that isn't expired, isn't graded, isn't completed and has no generated
 * link yet. Only the noun differs by type per the new-LMS terminology.
 */
export function buildAssignmentEmptyInstructionsMessage(
  input: AssignmentEmptyInstructionsInput,
): string {
  const noun = getAssignmentTypeNoun(input.assignmentKind)

  const canStartBelow =
    isAssessmentPlatform(input.platform) &&
    !input.isExpired &&
    input.submission?.data?.updatedScore !== true &&
    input.submission?.completed !== true &&
    !hasAssessPlatformLink(input.submission?.data ?? null)

  if (canStartBelow) {
    return `This ${noun} does not require additional instructions. You can start the ${noun} below.`
  }
  return `This ${noun} does not require additional instructions.`
}
