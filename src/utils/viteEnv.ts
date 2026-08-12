import { getAppOrigin } from '@/utils/appOrigin'
import { ORIGIN_URLS } from '@/utils/originUrls'

/** Legacy student app base URL for the current request origin. */
export function getOldStudentUiUrlFromEnv(): string | undefined {
  return ORIGIN_URLS[getAppOrigin()].oldStudentUi
}
