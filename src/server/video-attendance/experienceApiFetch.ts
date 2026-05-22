import { getRequest } from '@tanstack/react-start/server'

function getExperienceApiBaseUrl(): string {
  const base = process.env.EXPERIENCE_API_BASE_URL?.trim().replace(/\/$/, '')
  if (!base) {
    throw new Error('EXPERIENCE_API_BASE_URL is not configured')
  }
  return base
}

export async function experienceApiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const cookie = getRequest().headers.get('cookie')
  const headers = new Headers(init?.headers)

  if (cookie && !headers.has('cookie')) {
    headers.set('cookie', cookie)
  }

  return fetch(`${getExperienceApiBaseUrl()}${path}`, {
    ...init,
    headers,
  })
}
