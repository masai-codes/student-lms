import { createLecture, createSection } from '../../factories'
import { formatMysqlDatetime, offsetFromNow } from '../../utils/time'
import {
  flowScopedLectureTitle,
  PROGRAM_AGREEMENT_SETTINGS,
  resolveSectionVideos,
} from './constants'
import type { OnboardingSectionKey } from '../../types'
import { ONBOARDING_SECTION_DEFS } from './types'
import type { OnboardingFlowId } from './types'

import type { lectures, sections } from '@/db/schema'

type LectureSelect = typeof lectures.$inferSelect
type SectionSelect = typeof sections.$inferSelect

export async function seedOnboardingSectionsAndLectures(
  flowId: OnboardingFlowId,
  batchId: number,
  adminId: number,
): Promise<{
  sections: Record<OnboardingSectionKey, SectionSelect>
  lectures: Record<OnboardingSectionKey, Array<LectureSelect>>
}> {
  const sections = {} as Record<OnboardingSectionKey, SectionSelect>
  const lecturesBySection = {} as Record<OnboardingSectionKey, Array<LectureSelect>>
  const schedule = formatMysqlDatetime(offsetFromNow({ minutesAgo: 0 }))

  for (const def of ONBOARDING_SECTION_DEFS) {
    const section = await createSection({
      batchId,
      name: def.name,
      description: `${def.name} for ${flowId}`,
      type: def.type,
      settings: def.isProgram ? { ...PROGRAM_AGREEMENT_SETTINGS } : undefined,
    })
    sections[def.key] = section

    const sectionLectures: Array<LectureSelect> = []
    for (const baseTitle of def.lectureTitles) {
      sectionLectures.push(
        await createLecture({
          batchId,
          sectionId: section.id,
          userId: adminId,
          title: flowScopedLectureTitle(flowId, baseTitle),
          type: 'video',
          videos: resolveSectionVideos(def.name),
          schedule,
        }),
      )
    }
    lecturesBySection[def.key] = sectionLectures
  }

  return { sections, lectures: lecturesBySection }
}
