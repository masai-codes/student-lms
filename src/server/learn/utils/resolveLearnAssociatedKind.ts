import { LECTURE_RESOURCE_TYPE } from '@/server/learn/utils/resolveLectureLearningType'
import type { LearnAssociatedListItem } from '@/server/learn/learnAssociatedTypes'

export function resolveLearnAssociatedKindFromLectureType(
  lectureType: string,
): LearnAssociatedListItem['kind'] {
  return lectureType.trim().toLowerCase() === LECTURE_RESOURCE_TYPE
    ? 'resource'
    : 'lecture'
}
