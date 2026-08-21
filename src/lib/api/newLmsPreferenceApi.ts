import { fetchJson } from '@/lib/api/fetchJson'

const NEW_LMS_PREFERENCE_API = {
  newLmsPages: '/api/profile/new-lms-pages',
  tryNewTour: '/api/profile/try-new-tour',
} as const

export async function setNewLmsPagesPreference(
  enabled: boolean,
  feedback?: string,
): Promise<boolean> {
  const { enabled: updated } = await fetchJson<{ enabled: boolean }>(
    NEW_LMS_PREFERENCE_API.newLmsPages,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled, ...(feedback ? { feedback } : {}) }),
    },
  )
  return updated
}

export async function markTryNewTourSeen(): Promise<void> {
  await fetchJson<{ seen: boolean }>(NEW_LMS_PREFERENCE_API.tryNewTour, {
    method: 'POST',
  })
}
