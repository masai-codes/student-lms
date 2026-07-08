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
