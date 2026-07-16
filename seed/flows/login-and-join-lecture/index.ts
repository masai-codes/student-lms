export { loginAndJoinLectureConfig, loginAndJoinLectureTiming } from './config'
export { seedLoginAndJoinLecture } from './seed'

import { loginAndJoinLectureConfig } from './config'
import { seedLoginAndJoinLecture } from './seed'
import type { SeedFlowModule } from '../../types'

export const loginAndJoinLectureFlow: SeedFlowModule = {
  meta: loginAndJoinLectureConfig,
  seed: seedLoginAndJoinLecture,
}
