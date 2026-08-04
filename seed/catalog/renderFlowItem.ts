import type { SeedFlowMeta } from '../types'
import { DEV_PASSWORD_PLAINTEXT } from '../utils/constants'
import type { CatalogSeedState } from './seedState'
import { resolveLoginUserId } from './seedState'

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/**
 * Parse a seedCommand string (which may contain `# comment` lines between commands)
 * into an array of { label, command } blocks — one entry per runnable command.
 */
function parseSeedCommands(raw: string): Array<{ label: string; command: string }> {
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean)
  const blocks: Array<{ label: string; command: string }> = []
  let pendingLabel = ''

  for (const line of lines) {
    if (line.startsWith('#')) {
      // Strip leading `# ` and trailing `:` for a clean label
      pendingLabel = line.replace(/^#+\s*/, '').replace(/:$/, '').trim()
    } else {
      blocks.push({ label: pendingLabel, command: line })
      pendingLabel = ''
    }
  }
  return blocks
}

function renderSeedCommands(seedCommand: string): string {
  const blocks = parseSeedCommands(seedCommand)

  const items = blocks
    .map(
      ({ label, command }) => `
      <div class="cmd-block">
        ${label ? `<span class="cmd-label">${escapeHtml(label)}</span>` : ''}
        <div class="cmd-row">
          <code class="cmd-text">${escapeHtml(command)}</code>
          <button
            type="button"
            class="cmd-copy"
            data-cmd="${escapeHtml(command)}"
            title="Copy command"
            aria-label="Copy command"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <rect x="5" y="5" width="8" height="9" rx="1.2"/>
              <path d="M3 11H2.5A1.5 1.5 0 0 1 1 9.5v-7A1.5 1.5 0 0 1 2.5 1h7A1.5 1.5 0 0 1 11 2.5V3"/>
            </svg>
          </button>
        </div>
      </div>`,
    )
    .join('')

  return `<div class="cmd-list">${items}</div>`
}

function resolvePrimaryEmail(flow: SeedFlowMeta, primaryRole: string): string {
  return (
    flow.defaultCredentialEmails?.find((cred) => cred.role === primaryRole)
      ?.email ??
    flow.defaultCredentialEmails?.[0]?.email ??
    ''
  )
}

function rolePillClass(role: string): string {
  if (role === 'student') return 'student'
  if (role === 'admin') return 'admin'
  return 'default'
}

function renderCredentialRows(
  flow: SeedFlowMeta,
  flowState: CatalogSeedState[string] | undefined,
  secretLoginToken: string,
): string {
  const defaults = flow.defaultCredentialEmails ?? []
  const seededByRole = new Map(
    (flowState?.testUsers ?? []).map((user) => [user.role, user]),
  )

  return defaults
    .map((cred) => {
      const seeded = seededByRole.get(cred.role)
      const userIdCell = seeded
        ? `<td class="user-id-cell">${seeded.userId}</td>`
        : `<td class="user-id-cell muted">—</td>`
      const loginCell = secretLoginToken
        ? `<td><button type="button" class="btn btn-login btn-login-user" data-user-id="${seeded?.userId ?? ''}" data-user-email="${escapeHtml(cred.email)}" data-user-role="${escapeHtml(cred.role)}">Login</button></td>`
        : `<td class="muted">No token</td>`

      return `<tr data-user-role="${escapeHtml(cred.role)}">
        <td><span class="role-pill ${rolePillClass(cred.role)}">${escapeHtml(cred.role)}</span></td>
        <td>${escapeHtml(cred.email)}</td>
        <td><code>${escapeHtml(DEV_PASSWORD_PLAINTEXT)}</code></td>
        ${userIdCell}
        ${loginCell}
      </tr>`
    })
    .join('')
}

export function renderFlowItem(
  flow: SeedFlowMeta,
  seedState: CatalogSeedState,
  secretLoginToken: string,
): string {
  const flowState = seedState[flow.id]
  const primaryRole =
    flow.primaryLoginRole ?? flowState?.testUsers[0]?.role ?? 'student'
  const loginUserId = resolveLoginUserId(flowState, primaryRole)
  const loginEmail = resolvePrimaryEmail(flow, primaryRole)
  const loginDisabled = !secretLoginToken || (!loginUserId && !loginEmail)
  const loginTitle = !secretLoginToken
    ? 'Set SECRET_LOGIN_TOKEN and regenerate the catalog'
    : loginUserId
      ? `Secret-login as ${primaryRole} (userId ${loginUserId})`
      : `Secret-login as ${primaryRole} (${loginEmail}) — run seed to resolve userId`

  const timingRows = Object.entries(flow.timing)
    .map(
      ([key, value]) =>
        `<tr><td><code>${escapeHtml(key)}</code></td><td>${escapeHtml(String(value))}</td></tr>`,
    )
    .join('')

  const entityRows = flowState
    ? Object.entries(flowState.entityIds)
        .filter(([, value]) => value != null)
        .map(
          ([key, value]) =>
            `<tr><td><code>${escapeHtml(key)}</code></td><td>${escapeHtml(String(value))}</td></tr>`,
        )
        .join('')
    : ''

  const resolvedTimingRows = flowState
    ? Object.entries(flowState.timing)
        .map(
          ([key, value]) =>
            `<tr><td><code>${escapeHtml(key)}</code></td><td>${escapeHtml(value)}</td></tr>`,
        )
        .join('')
    : ''

  const unpaidComponentsPanel =
    flow.id === 'onboarding-fees-unpaid'
      ? `<div class="panel-section">
          <h3>Components in the flow</h3>
          <table>
            <thead><tr><th>Component</th><th>What to expect</th></tr></thead>
            <tbody>
              <tr><td><code>1. LMS Walkthrough Videos</code></td><td>3 walkthrough videos; watch ≥10s to tick, then the next video auto-plays.</td></tr>
              <tr><td><code>2. Profile Photo</code></td><td>Capture/retake photo; completion when <code>profiles.meta.profile_pic</code> is a valid http(s) URL.</td></tr>
              <tr><td><code>3. Download App</code></td><td>QR-only step; completion when a <code>user_device_tokens</code> row exists for the student. (Pre-complete via <code>-- --with-app-download</code>.)</td></tr>
              <tr><td><code>4. Payment pending banners</code></td><td>Fee countdown appears in the onboarding modal and dashboard while <code>full_fees_paid = 0</code>.</td></tr>
              <tr><td><code>5. Purple Finish CTA</code></td><td>Purple banner: “Finish onboarding … <code>completed/total</code> steps completed” (total is <code>5</code> for this flow; e.g. <code>4/5</code> when all but one step is done).</td></tr>
            </tbody>
          </table>
        </div>`
      : ''

  const paidComponentsPanel =
    flow.id === 'onboarding-fees-paid'
      ? `<div class="panel-section">
          <h3>Components in the flow</h3>
          <table>
            <thead><tr><th>Component</th><th>What to expect</th></tr></thead>
            <tbody>
              <tr><td><code>1. LMS Walkthrough Videos</code></td><td>Same auto-next walkthrough as onboarding-fees-unpaid.</td></tr>
              <tr><td><code>2. Program Onboarding Videos</code></td><td>"Upload your documents" / "Complete your student kit" walkthrough videos, auto-next.</td></tr>
              <tr><td><code>3. Agreement signing</code></td><td>POSH policy agreement modal; pending until signed. Pre-sign via <code>-- --agreement-signed</code>.</td></tr>
              <tr><td><code>4. Upload Documents</code></td><td>Driven by a <b>simulated onward</b> response (<code>documents.required</code> / <code>documents.documentsUploaded</code>) — see <code>seed/onward-simulation/</code>. Toggle via <code>-- --docs-required --docs-uploaded</code>; run <code>npx tsx seed/onward-simulation/onwardMockServer.ts</code> and point <code>ADMISSIONS_API_BASE_URL</code> at it to serve the response live.</td></tr>
              <tr><td><code>5. Student Kit</code></td><td>Same simulated onward shape (<code>kit.showKit</code> / <code>kit.detailsFilled</code> / <code>kit.tracking</code>), mirrored into <code>user_batch_admission_data</code> so it renders today. Toggle via <code>-- --kit-shown --kit-filled --kit-tracking</code>.</td></tr>
              <tr><td><code>6. ID card</code></td><td>Unlock logic unchanged: still just videos watched + agreement signed (Documents/Kit completion is not required).</td></tr>
            </tbody>
          </table>
        </div>`
      : ''

  const dashboardHomePanel =
    flow.id === 'dashboard-home'
      ? `<div class="panel-section">
          <h3>Components in the flow</h3>
          <table>
            <thead><tr><th>Component</th><th>What to expect</th></tr></thead>
            <tbody>
              <tr><td><code>1. My Schedule</code></td><td>7-day IST window (today→+6): 2 lectures (today + day 3) + 2 assignments (yesterday incomplete + day 5); other days show empty placeholders.</td></tr>
              <tr><td><code>2. Pending Tasks</code></td><td>Badge <code>2</code>: 1 catch-up lecture (ended yesterday, 7-day catch-up window) + 1 open assignment (not begun). Excluded rows seeded but hidden: started assignment, overdue assignment, optional catch-up lecture.</td></tr>
              <tr><td><code>3. Announcements</code></td><td>Exactly <code>5</code> visible (3 section + 2 For You). Excluded: read, expired, future announcements.</td></tr>
              <tr><td><code>4. Product Updates</code></td><td><code>7</code> global <code>whatsnew</code> rows seeded; dashboard shows newest <code>5</code>.</td></tr>
            </tbody>
          </table>
          <p class="note">Student has no admission row — no T0 guided-tour overlay on the dashboard.</p>
        </div>`
      : ''

  const liveLecturePhasesPanel =
    flow.id === 'live-lecture-phases'
      ? `<div class="panel-section">
          <h3>Lectures in the flow</h3>
          <table>
            <thead><tr><th>Lecture</th><th>Timing (relative to seed)</th><th>Expected UI</th></tr></thead>
            <tbody>
              <tr><td><code>beforeUnlockLectureId</code></td><td>Starts in ~20 min (outside 10-min join window)</td><td>Clock icon · “Live lecture hasn't started yet” · unlock time shown</td></tr>
              <tr><td><code>duringJoinLectureId</code></td><td>Starts in ~3 min (inside 5-min-before → conclude+30 min window)</td><td>Video icon · join button active · mute reminder</td></tr>
              <tr><td><code>optionalLiveBeforeUnlockLectureId</code></td><td>Same timing as before unlock · <code>optional: 1</code></td><td>Same clock / not-started UI · Recommended chip (no attendance badge)</td></tr>
              <tr><td><code>optionalLiveDuringJoinLectureId</code></td><td>Same timing as during join · <code>optional: 1</code></td><td>Join button active · Recommended chip (no attendance badge)</td></tr>
              <tr><td><code>videoMandatoryLectureId</code></td><td><code>type: video</code> · schedule in the past · mandatory</td><td>Video player unlocked · Mandatory chip</td></tr>
              <tr><td><code>videoOptionalLectureId</code></td><td><code>type: video</code> · schedule in the past · optional</td><td>Video player unlocked · Recommended chip</td></tr>
              <tr><td><code>afterNoRecordingLectureId</code></td><td>Ended ~90 min ago (past conclude+30 grace)</td><td>Blank video container · “Recording not available yet”</td></tr>
              <tr><td><code>afterWithRecordingAttendanceOffLectureId</code></td><td>Ended ~90 min ago · section <code>enableVideoAttendance: false</code>, <code>considerVideoAttendanceForActualAttendance: false</code></td><td>Full recording player · disclaimer: recording does <b>not</b> count for attendance</td></tr>
              <tr><td><code>afterWithRecordingAttendanceOnLectureId</code></td><td>Ended ~90 min ago · section <code>enableVideoAttendance: true</code>, <code>considerVideoAttendanceForActualAttendance: true</code>, <code>minimumVideoWatchPercentage: 5</code></td><td>Recording player · tabs seeded (Description, AI Summary, Transcript, Associated Content) · watch past 5% to flip Present</td></tr>
            </tbody>
          </table>
          <p class="note">Recording lectures use the Masai CDN HLS master playlist (<code>master.m3u8</code>) for multi-quality playback (360/480/720/1080). Open from Learn → the matching section.</p>
        </div>`
      : ''

  const LECTURE_FLOW_IDS = new Set(['login-and-join-lecture', 'live-lecture-phases'])
  const isLecture = LECTURE_FLOW_IDS.has(flow.id)
  const badgeClass = isLecture ? 'flow-badge lec' : 'flow-badge'
  const badgeLabel = isLecture ? 'LECTURE' : 'FLOW'

  return `
    <article class="flow-item" data-flow-id="${escapeHtml(flow.id)}" data-search="${escapeHtml(`${flow.id} ${flow.description}`.toLowerCase())}">
      <div class="flow-row">
        <button type="button" class="flow-toggle" aria-expanded="false">
          <span class="${badgeClass}">${badgeLabel}</span>
          <span class="flow-id">${escapeHtml(flow.id)}</span>
          <span class="flow-summary">${escapeHtml(flow.description)}</span>
          <svg class="chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 4 10 8 6 12"/></svg>
        </button>
        <button
          type="button"
          class="btn btn-login btn-login-flow"
          data-user-id="${loginUserId ?? ''}"
          data-user-email="${escapeHtml(loginEmail)}"
          data-user-role="${escapeHtml(primaryRole)}"
          ${loginDisabled ? 'disabled' : ''}
          title="${escapeHtml(loginTitle)}"
        >Login</button>
      </div>
      <div class="flow-panel" hidden>
        <div class="panel-section">
          <h3>Seed command</h3>
          ${renderSeedCommands(flow.seedCommand)}
        </div>
        ${unpaidComponentsPanel}
        ${paidComponentsPanel}
        ${dashboardHomePanel}
        ${liveLecturePhasesPanel}
        <div class="panel-grid">
          <div class="panel-section">
            <h3>Timing offsets</h3>
            <div class="table-wrap">
            <table>
              <thead><tr><th>Key</th><th>Offset</th></tr></thead>
              <tbody>${timingRows}</tbody>
            </table>
            </div>
          </div>
          ${
            resolvedTimingRows
              ? `<div class="panel-section">
            <h3>Last seeded timestamps</h3>
            <p class="note">Seeded ${escapeHtml(flowState?.seededAt ?? '')}</p>
            <div class="table-wrap">
            <table>
              <thead><tr><th>Key</th><th>Value</th></tr></thead>
              <tbody>${resolvedTimingRows}</tbody>
            </table>
            </div>
          </div>`
              : ''
          }
        </div>
        ${
          entityRows
            ? `<div class="panel-section">
          <h3>Entity IDs</h3>
          <div class="table-wrap">
          <table>
            <thead><tr><th>Entity</th><th>ID</th></tr></thead>
            <tbody>${entityRows}</tbody>
          </table>
          </div>
        </div>`
            : ''
        }
        <div class="panel-section">
          <h3>Test users</h3>
          <p class="note">Password: <code>${escapeHtml(DEV_PASSWORD_PLAINTEXT)}</code>. Primary login role: <code>${escapeHtml(primaryRole)}</code>.</p>
          <div class="table-wrap">
          <table>
            <thead><tr><th>Role</th><th>Email</th><th>Password</th><th>User ID</th><th></th></tr></thead>
            <tbody>${renderCredentialRows(flow, flowState, secretLoginToken)}</tbody>
          </table>
          </div>
        </div>
      </div>
    </article>`
}

export function buildSecretLoginUrl(
  token: string,
  target: { userId?: number; email?: string },
): string {
  const params = new URLSearchParams({ token })
  if (target.userId != null) {
    params.set('userId', String(target.userId))
  } else if (target.email) {
    params.set('email', target.email)
  }
  return `/api/secret-login?${params.toString()}`
}
