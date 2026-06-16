import { jsonOk } from '@/server/api/http/responses'

export interface ServerTimeResult {
  serverTime: string
}

export async function handleGetServerTime(): Promise<Response> {
  try {
    const res = await fetch('https://timeapi.io/api/time/current/zone?timeZone=UTC')
    const data = (await res.json()) as { dateTime: string }
    // dateTime is like "2026-06-15T13:29:06.818" — append Z to mark as UTC
    const serverTime = new Date(data.dateTime + 'Z').toISOString()
    return jsonOk<ServerTimeResult>({ serverTime })
  } catch {
    // fallback to machine clock if external API fails
    return jsonOk<ServerTimeResult>({ serverTime: new Date().toISOString() })
  }
}
