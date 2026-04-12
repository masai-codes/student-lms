import { defineEventHandler, getRequestHeader, setResponseStatus } from 'h3'

import { getLevelupSsoResult } from '../../src/server/levelup/getLevelupSsoResponse'

/**
 * `GET /levelup-sso` — same contract as `experience-api/src/routes/levelupSso.ts`
 * (session cookie → JSON `{ success, data: { url, token }, message }`).
 */
export default defineEventHandler(async (event) => {
  const cookie = getRequestHeader(event, 'cookie') ?? null
  const result = await getLevelupSsoResult(cookie)
  setResponseStatus(event, result.status)
  return result.body
})
