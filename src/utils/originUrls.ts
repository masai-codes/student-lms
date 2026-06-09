import type { AppOrigin } from '@/utils/appOrigin'

type OriginUrls = {
  /** Legacy student app base URL (historically `VITE_OLD_STUDENT_UI_URL`). */
  oldStudentUi: string
  /** This (v2) student app's canonical base URL for the origin. */
  newStudentUi: string
}

/**
 * Per-origin URLs. Single source of truth now that we ship ONE build and detect
 * the origin from the request host at runtime (see `getAppOrigin`). Previously
 * these lived in `origins.config.cjs` and were baked per build. Update here and
 * rebuild.
 */
export const ORIGIN_URLS: Record<AppOrigin, OriginUrls> = {
  masai: {
    oldStudentUi: 'https://demo-students.masaischool.com',
    newStudentUi: 'https://students-demo-v2.masaischool.com',
  },
  ihub: {
    oldStudentUi: 'https://demo-students.ihubiitrcourses.org',
    newStudentUi: 'https://students-demo-v2.ihubiitrcourses.org',
  },
}
