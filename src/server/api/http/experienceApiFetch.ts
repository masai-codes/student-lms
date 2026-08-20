import { getRequest } from '@tanstack/react-start/server'

export function getExperienceApiBaseUrl(): string | null {
  const base = process.env.EXPERIENCE_API_BASE_URL?.trim().replace(/\/$/, '')
  return base || null
}

async function experienceApiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const base = getExperienceApiBaseUrl()
  if (!base) {
    throw new Error('EXPERIENCE_API_NOT_CONFIGURED')
  }

  const cookie = getRequest().headers.get('cookie')
  const headers = new Headers(init?.headers)

  if (cookie && !headers.has('cookie')) {
    headers.set('cookie', cookie)
  }

  return fetch(`${base}${path}`, {
    ...init,
    headers,
  })
}
