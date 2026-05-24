import type { ApiErrorBody } from '@/server/api/http/responses'

export class ApiClientError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, body: Partial<ApiErrorBody>) {
    super(body.message ?? body.code ?? 'API_ERROR')
    this.status = status
    this.code = body.code ?? 'API_ERROR'
  }
}
