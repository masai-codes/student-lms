import type { LearningType } from '@/server/learn/types'

export const LECTURE_RESOURCE_TYPE = 'reading'

export function resolveLectureLearningType(lectureType: string): LearningType {
  return lectureType === LECTURE_RESOURCE_TYPE ? 'resource' : 'lecture'
}

export function isResourceLectureType(lectureType: string): boolean {
  return resolveLectureLearningType(lectureType) === 'resource'
}
