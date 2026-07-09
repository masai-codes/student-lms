import '../utils/loadEnv'

import { createServer } from 'node:http'

import { buildSimulatedOnwardStatus } from './buildSimulatedOnwardStatus'
import { readOnwardFixtures } from './onwardFixtureStore'

const PORT = Number(process.env.ONWARD_MOCK_PORT ?? 4500)

/**
 * Local stand-in for the real "onward" admissions API, implementing the one
 * route `getAdmissionsStudentStatus` (`src/server/admissions/`) calls:
 *
 *   GET /lms/student-status?student_code=<username>&include=documents,kit
 *   header: x-api-key
 *
 * Point `.env.local`'s `ADMISSIONS_API_BASE_URL` at this server (and set any
 * matching `ADMISSIONS_API_KEY`) to make Upload-Document testing dynamic
 * without a real onward connection. Serves whatever `seed onboarding-fees-paid`
 * last wrote to `onward-fixtures.json`, keyed by student username.
 *
 * Note: Student Kit is *not* wired to this endpoint in the running app today
 * (`getStudentKitStatus.service.ts` reads DB columns) — the seed flow mirrors
 * the same simulated kit values into those columns so Student Kit still
 * renders correctly without any app-code changes.
 */
const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)

  if (url.pathname !== '/lms/student-status') {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found' }))
    return
  }

  const expectedKey = process.env.ADMISSIONS_API_KEY?.trim()
  const providedKey = req.headers['x-api-key']
  if (expectedKey && providedKey !== expectedKey) {
    res.writeHead(401, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid api key' }))
    return
  }

  const studentCode = url.searchParams.get('student_code') ?? ''
  const fixtures = readOnwardFixtures()
  const status = fixtures[studentCode] ?? buildSimulatedOnwardStatus()

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(status))
})

const isDirectRun = process.argv[1]?.includes('onwardMockServer')
if (isDirectRun) {
  server.listen(PORT, () => {
    console.log(`Onward mock server listening on http://localhost:${PORT}`)
    console.log('Set in .env.local:')
    console.log(`  ADMISSIONS_API_BASE_URL=http://localhost:${PORT}`)
    console.log('  ADMISSIONS_API_KEY=<any value — must match on both sides>')
  })
}

export { server as onwardMockServer }
