import { listFlows } from '../registry'
import type { SeedFlowMeta } from '../types'
import { CATALOG_SCRIPT, CATALOG_STYLES } from './catalogAssets'
import { renderFlowItem } from './renderFlowItem'
import { readSeedState, type CatalogSeedState } from './seedState'

export type CatalogRenderInput = {
  flows?: SeedFlowMeta[]
  seedState?: CatalogSeedState
  secretLoginToken?: string
}

/** Flows that belong to the "Lectures - Listing & Details" section. */
const LECTURE_FLOW_IDS = new Set([
  'login-and-join-lecture',
  'live-lecture-phases',
])

type SectionDef = {
  key: string
  label: string
  flows: SeedFlowMeta[]
}

function groupFlowsIntoSections(flows: SeedFlowMeta[]): SectionDef[] {
  const t0Flows: SeedFlowMeta[] = []
  const lectureFlows: SeedFlowMeta[] = []

  for (const flow of flows) {
    if (LECTURE_FLOW_IDS.has(flow.id)) {
      lectureFlows.push(flow)
    } else {
      t0Flows.push(flow)
    }
  }

  const sections: SectionDef[] = []
  if (t0Flows.length > 0) {
    sections.push({
      key: 't0',
      label: 'T0 — Onboarding & Dashboard',
      flows: t0Flows,
    })
  }
  if (lectureFlows.length > 0) {
    sections.push({
      key: 'lectures',
      label: 'Lectures — Listing & Details',
      flows: lectureFlows,
    })
  }
  return sections
}

function renderSection(
  section: SectionDef,
  seedState: CatalogSeedState,
  secretLoginToken: string,
): string {
  const flowItems = section.flows
    .map((flow) => renderFlowItem(flow, seedState, secretLoginToken))
    .join('\n')

  return `<div class="section-group" data-section="${section.key}">
    <div class="section-header" role="button" aria-expanded="true" tabindex="0">
      <span class="section-pip" aria-hidden="true"></span>
      <span class="section-title">${section.label}</span>
      <span class="section-count">${section.flows.length} flow${section.flows.length !== 1 ? 's' : ''}</span>
      <svg class="section-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="4 6 8 10 12 6"/>
      </svg>
    </div>
    <div class="section-body">
      ${flowItems}
    </div>
  </div>`
}

export function renderCatalogHtml(input: CatalogRenderInput = {}): string {
  const flows = input.flows ?? listFlows()
  const seedState = input.seedState ?? readSeedState()
  const secretLoginToken =
    input.secretLoginToken ?? process.env.SECRET_LOGIN_TOKEN ?? ''

  const sections = groupFlowsIntoSections(flows)
  const totalFlows = flows.length

  const sectionsHtml = sections
    .map((s) => renderSection(s, seedState, secretLoginToken))
    .join('\n')

  const tokenWarning =
    secretLoginToken.length === 0
      ? '<div class="warn">SECRET_LOGIN_TOKEN is not set — Login buttons are disabled. Add it to <code>.env.local</code> and regenerate the catalog.</div>'
      : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Seed Flow Catalog</title>
  <style>${CATALOG_STYLES}</style>
</head>
<body>
  <header class="topbar">
    <div class="topbar-logo" aria-hidden="true">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
    </div>
    <div class="topbar-titles">
      <h1>Seed Flow Catalog</h1>
      <span class="topbar-sub">Testing flows for QA &amp; development</span>
    </div>
    <span class="topbar-badge">${totalFlows} flows</span>
  </header>
  <main class="layout">
    ${tokenWarning}
    <div class="toolbar">
      <div class="search-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input id="flow-search" type="search" placeholder="Search flows by ID or description…" aria-label="Filter flows" />
      </div>
    </div>
    <div id="flow-list">
      ${sectionsHtml || '<p class="empty">No flows registered.</p>'}
    </div>
  </main>
  <script>window.__SEED_CATALOG__ = ${JSON.stringify({ secretLoginToken })};</script>
  <script>${CATALOG_SCRIPT}</script>
</body>
</html>`
}

export { buildSecretLoginUrl } from './renderFlowItem'
