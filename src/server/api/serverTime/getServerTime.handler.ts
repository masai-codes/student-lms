import { jsonOk } from '@/server/api/http/responses'

export interface ServerTimeResult {
  serverTime: string
}

export function handleGetServerTime(): Response {
  return jsonOk<ServerTimeResult>({ serverTime: new Date().toISOString() })
}
