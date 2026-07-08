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

function resolvePrimaryEmail(flow: SeedFlowMeta, primaryRole: string): string {
  return (
    flow.defaultCredentialEmails?.find((cred) => cred.role === primaryRole)?.email ??
    flow.defaultCredentialEmails?.[0]?.email ??
    ''
  )
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
        <td>${escapeHtml(cred.role)}</td>
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
  const primaryRole = flow.primaryLoginRole ?? flowState?.testUsers[0]?.role ?? 'student'
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
              <tr><td><code>1. My Schedule</code></td><td>7-day IST window (today→+6): 2 lectures (today + day 3) + 1 assignment (day 5); other days show empty placeholders.</td></tr>
              <tr><td><code>2. Pending Tasks</code></td><td>Badge <code>2</code>: 1 catch-up lecture (ended yesterday, 7-day catch-up window) + 1 open assignment (not begun). Excluded rows seeded but hidden: started assignment, overdue assignment, optional catch-up lecture.</td></tr>
              <tr><td><code>3. Announcements</code></td><td>Exactly <code>5</code> visible (3 section + 2 For You). Excluded: read, expired, future announcements.</td></tr>
              <tr><td><code>4. Product Updates</code></td><td><code>7</code> global <code>whatsnew</code> rows seeded; dashboard shows newest <code>5</code>.</td></tr>
            </tbody>
          </table>
          <p class="note">Student has no admission row — no T0 guided-tour overlay on the dashboard.</p>
        </div>`
      : ''

  return `
    <article class="flow-item" data-flow-id="${escapeHtml(flow.id)}" data-search="${escapeHtml(`${flow.id} ${flow.description}`.toLowerCase())}">
      <div class="flow-row">
        <button type="button" class="flow-toggle" aria-expanded="false">
          <span class="flow-badge">FLOW</span>
          <span class="flow-id">${escapeHtml(flow.id)}</span>
          <span class="flow-summary">${escapeHtml(flow.description)}</span>
          <span class="chevron" aria-hidden="true">▸</span>
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
          <pre><code>${escapeHtml(flow.seedCommand)}</code></pre>
        </div>
        ${unpaidComponentsPanel}
        ${paidComponentsPanel}
        ${dashboardHomePanel}
        <div class="panel-grid">
          <div class="panel-section">
            <h3>Timing offsets</h3>
            <table>
              <thead><tr><th>Key</th><th>Offset</th></tr></thead>
              <tbody>${timingRows}</tbody>
            </table>
          </div>
          ${
            resolvedTimingRows
              ? `<div class="panel-section">
            <h3>Last seeded timestamps</h3>
            <p class="note">Seeded ${escapeHtml(flowState?.seededAt ?? '')}</p>
            <table>
              <thead><tr><th>Key</th><th>Value</th></tr></thead>
              <tbody>${resolvedTimingRows}</tbody>
            </table>
          </div>`
              : ''
          }
        </div>
        ${
          entityRows
            ? `<div class="panel-section">
          <h3>Entity IDs</h3>
          <table>
            <thead><tr><th>Entity</th><th>ID</th></tr></thead>
            <tbody>${entityRows}</tbody>
          </table>
        </div>`
            : ''
        }
        <div class="panel-section">
          <h3>Test users</h3>
          <p class="note">Password: <code>${escapeHtml(DEV_PASSWORD_PLAINTEXT)}</code>. Primary login role: <code>${escapeHtml(primaryRole)}</code>.</p>
          <table>
            <thead><tr><th>Role</th><th>Email</th><th>Password</th><th>User ID</th><th></th></tr></thead>
            <tbody>${renderCredentialRows(flow, flowState, secretLoginToken)}</tbody>
          </table>
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
