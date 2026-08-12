export function getExperienceApiBaseUrl(): string | null {
  const base = process.env.EXPERIENCE_API_BASE_URL?.trim().replace(/\/$/, '')
  return base || null
}
