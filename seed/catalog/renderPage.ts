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

export function renderCatalogHtml(input: CatalogRenderInput = {}): string {
  const flows = input.flows ?? listFlows()
  const seedState = input.seedState ?? readSeedState()
  const secretLoginToken =
    input.secretLoginToken ?? process.env.SECRET_LOGIN_TOKEN ?? ''

  const flowItems = flows
    .map((flow) => renderFlowItem(flow, seedState, secretLoginToken))
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
  <main class="layout">
    ${tokenWarning}
    <div class="toolbar">
      <input id="flow-search" type="search" placeholder="Filter flows by id or description…" aria-label="Filter flows" />
    </div>
    <div class="flow-list" id="flow-list">
      ${flowItems || '<p class="empty">No flows registered.</p>'}
    </div>
  </main>
  <script>window.__SEED_CATALOG__ = ${JSON.stringify({ secretLoginToken })};</script>
  <script>${CATALOG_SCRIPT}</script>
</body>
</html>`
}

export { buildSecretLoginUrl } from './renderFlowItem'
