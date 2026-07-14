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
  const lecturesBySection = {} as Record<
    OnboardingSectionKey,
    Array<LectureSelect>
  >

  for (const def of ONBOARDING_SECTION_DEFS) {
    const section = await createSection({
      batchId,
      name: def.name,
      description: `${def.name} for ${flowId}`,
      type: def.type,
      settings:
        def.key === 'programOnboardingWeb'
          ? { ...PROGRAM_AGREEMENT_SETTINGS }
          : undefined,
    })
    sections[def.key] = section

    // Lectures are loaded with ORDER BY schedule DESC. Stagger so title order in
    // LMS_LECTURE_TITLES / PROGRAM_LECTURE_TITLES appears first→last in the tour
    // (first title = newest schedule). Clear zoomLink so the player uses `videos`
    // only — otherwise the zoom fallback can replace a missing/broken recording.
    const sectionLectures: Array<LectureSelect> = []
    for (let i = 0; i < def.lectureTitles.length; i++) {
      const baseTitle = def.lectureTitles[i]
      const minutesAgo = def.lectureTitles.length - 1 - i
      sectionLectures.push(
        await createLecture({
          batchId,
          sectionId: section.id,
          userId: adminId,
          title: flowScopedLectureTitle(flowId, baseTitle),
          type: 'video',
          videos: resolveSectionVideos(def.name),
          zoomLink: null,
          schedule: formatMysqlDatetime(offsetFromNow({ minutesAgo })),
        }),
      )
    }
    lecturesBySection[def.key] = sectionLectures
  }

  return { sections, lectures: lecturesBySection }
}
