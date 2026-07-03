import '../utils/loadEnv'

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { generateCatalogHtml } from '../catalog/generate'
import { SEED_STATE_PATH, writeSeedState } from '../catalog/seedState'
import { listFlows, seedFlow } from '../index'

const catalogDir = join(dirname(fileURLToPath(import.meta.url)), '../catalog')
const catalogHtmlPath = join(catalogDir, 'index.html')
const publicCatalogDir = join(process.cwd(), 'public/seed-catalog')

function publishCatalog(html: string): void {
  writeFileSync(catalogHtmlPath, html, 'utf8')
  mkdirSync(publicCatalogDir, { recursive: true })
  writeFileSync(join(publicCatalogDir, 'index.html'), html, 'utf8')
  if (existsSync(SEED_STATE_PATH)) {
    copyFileSync(SEED_STATE_PATH, join(publicCatalogDir, 'seed-state.json'))
  }
}

function printUsage(): void {
  console.log('Usage: npm run seed [flow-id] [--no-reset]\n')
  console.log('Available flows:')
  for (const flow of listFlows()) {
    console.log(`  ${flow.id} — ${flow.description}`)
  }
}

function printResult(result: Awaited<ReturnType<typeof seedFlow>>): void {
  console.log('\nSeeding completed.\n')
  console.log('Test users:')
  console.table(
    result.testUsers.map((user) => ({
      role: user.role,
      email: user.email,
      password: user.password,
      userId: user.userId,
    })),
  )

  console.log('\nCreated entities:')
  console.log(`  batch id:    ${result.entities.batch.id}`)
  console.log(`  section id:  ${result.entities.section.id}`)
  console.log(`  lecture id:  ${result.entities.lecture.id}`)
  console.log('\nTiming:')
  for (const [key, value] of Object.entries(result.timing)) {
    console.log(`  ${key}: ${value}`)
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const flowId = args.find((arg) => !arg.startsWith('--'))
  const noReset = args.includes('--no-reset')

  if (!flowId) {
    printUsage()
    return
  }

  console.log(`Seeding flow "${flowId}"${noReset ? ' (no reset)' : ''}...`)

  const result = await seedFlow(flowId, { reset: !noReset })
  writeSeedState(result, { replaceAll: !noReset })
  publishCatalog(generateCatalogHtml())
  printResult(result)
  console.log('\nCatalog updated — open http://localhost:3002/seed-catalog/')
}

main().catch((error: unknown) => {
  console.error('Seeding error:', error)
  process.exitCode = 1
})
