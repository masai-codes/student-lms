import { createIsomorphicFn } from '@tanstack/react-start'

import type { ApiErrorBody } from '@/server/api/http/responses'
import { ApiClientError } from '@/lib/api/apiClientError'
import { resolveTrueStatus } from '@/lib/api/cloudFrontSafeStatus'
import { resolveApiFetchUrl } from '@/lib/api/resolveApiFetchUrl'

export type FetchJsonOptions = RequestInit & {
  cookieHeader?: string | null
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as Partial<ApiErrorBody>
    // Restore the true status (403/404) the server remapped past CloudFront.
    throw new ApiClientError(resolveTrueStatus(response), body)
  }
  return (await response.json()) as T
}

const fetchJsonIsomorphic = createIsomorphicFn()
  .client(async (path: string, options: FetchJsonOptions = {}) => {
    const { headers, ...init } = options
    const url = resolveApiFetchUrl(path)

    const response = await fetch(url, {
      ...init,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...headers,
      },
    })

    return parseJsonResponse(response)
  })
  .server(async (path: string, options: FetchJsonOptions = {}) => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const { cookieHeader, headers, ...init } = options
    const url = resolveApiFetchUrl(path)
    const cookie = cookieHeader ?? getRequest().headers.get('cookie')

    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(cookie ? { cookie } : {}),
        ...headers,
      },
    })

    return parseJsonResponse(response)
  })

export async function fetchJson<T>(
  path: string,
  options: FetchJsonOptions = {},
): Promise<T> {
  return fetchJsonIsomorphic(path, options) as Promise<T>
}
