import { ApiClientError } from '@/lib/api/apiClientError'
import type { ApiErrorBody } from '@/server/api/http/responses'

type FetchJsonOptions = RequestInit & {
  /** Forward session cookie during SSR (loaders). */
  cookieHeader?: string | null
}

export async function fetchJson<T>(path: string, options: FetchJsonOptions = {}): Promise<T> {
  const { cookieHeader, headers, ...init } = options

  const response = await fetch(path, {
    ...init,
    credentials: cookieHeader == null ? 'same-origin' : undefined,
    headers: {
      Accept: 'application/json',
      ...(cookieHeader != null ? { cookie: cookieHeader } : {}),
      ...headers,
    },
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as Partial<ApiErrorBody>
    throw new ApiClientError(response.status, body)
  }

  return (await response.json()) as T
}
