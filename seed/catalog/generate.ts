import '../utils/loadEnv'

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { renderCatalogHtml } from './renderPage'
import { SEED_STATE_PATH } from './seedState'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outputPath = join(__dirname, 'index.html')
const publicOutputDir = join(process.cwd(), 'public/seed-catalog')

export { renderCatalogHtml, buildSecretLoginUrl } from './renderPage'
export {
  readSeedState,
  writeSeedState,
  resolveLoginUserId,
  SEED_STATE_PATH,
} from './seedState'
export type { CatalogSeedState, FlowSeedState } from './seedState'

export function generateCatalogHtml(): string {
  return renderCatalogHtml()
}

function publishCatalogArtifacts(html: string): void {
  writeFileSync(outputPath, html, 'utf8')

  mkdirSync(publicOutputDir, { recursive: true })
  writeFileSync(join(publicOutputDir, 'index.html'), html, 'utf8')

  if (existsSync(SEED_STATE_PATH)) {
    copyFileSync(SEED_STATE_PATH, join(publicOutputDir, 'seed-state.json'))
  }
}

function main(): void {
  const html = generateCatalogHtml()
  publishCatalogArtifacts(html)
  console.log(`Catalog written to ${outputPath}`)
  console.log(`Catalog published to ${join(publicOutputDir, 'index.html')}`)
  console.log(
    'Open http://localhost:3002/seed-catalog/ while the dev server is running.',
  )
}

const isDirectRun = process.argv[1]?.includes('catalog/generate')
if (isDirectRun) {
  main()
}
