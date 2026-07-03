import { createVideoAttendance } from '../../factories'
import type { OnboardingSectionKey } from '../../types'
import type { OnboardingScenario } from './types'

import type { batches, lectures, sections, users } from '@/db/schema'

type SeedVideoInput = {
  student: typeof users.$inferSelect
  admin: typeof users.$inferSelect
  batch: typeof batches.$inferSelect
  sections: Record<OnboardingSectionKey, typeof sections.$inferSelect>
  lectures: Record<OnboardingSectionKey, Array<typeof lectures.$inferSelect>>
}

export async function seedOnboardingVideoAttendances(
  world: SeedVideoInput,
  mode: OnboardingScenario['videoAttendances'],
): Promise<void> {
  if (!mode || mode === 'none') return

  const keys: Array<OnboardingSectionKey> =
    mode === 'all-lms'
      ? ['lmsWalkthroughWeb', 'lmsWalkthroughApp']
      : [
          'lmsWalkthroughWeb',
          'lmsWalkthroughApp',
          'programOnboardingWeb',
          'programOnboardingApp',
        ]

  for (const key of keys) {
    const section = world.sections[key]
    for (const lecture of world.lectures[key]) {
      await createVideoAttendance({
        lectureId: lecture.id,
        userId: world.student.id,
        hostId: world.admin.id,
        batchId: world.batch.id,
        sectionId: section.id,
      })
    }
  }
}
