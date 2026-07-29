import { BASE_URL, SECRET_LOGIN_TOKEN } from './agenthand/config'
import { readSeedState } from './agenthand/seedState'

/**
 * Vitest globalSetup for the e2e suite. Fails fast with actionable messages if
 * the preconditions aren't met, so a red run points at the fix, not at Puppeteer
 * internals. It does NOT start the dev server (run `npm run dev` separately, or
 * use the browser-verify skill's preview_start) and does NOT seed the DB.
 */
export default async function setup(): Promise<void> {
  const problems: string[] = []

  if (!SECRET_LOGIN_TOKEN) {
    problems.push(
      'SECRET_LOGIN_TOKEN is missing — add it to .env.local (secret-login returns 503 without it).',
    )
  }

  try {
    readSeedState()
  } catch (error) {
    problems.push((error as Error).message)
  }

  // Is the dev server reachable?
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(`${BASE_URL}/`, { signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok && res.status >= 500) {
      problems.push(`Dev server at ${BASE_URL} responded ${res.status}.`)
    }
  } catch {
    problems.push(
      `Dev server not reachable at ${BASE_URL}. Start it with \`npm run dev\` (port 3002).`,
    )
  }

  if (problems.length > 0) {
    throw new Error(
      `\ne2e preconditions not met:\n  - ${problems.join('\n  - ')}\n`,
    )
  }
}
