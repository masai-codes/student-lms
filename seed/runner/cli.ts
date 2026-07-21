import '../utils/loadEnv'

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { generateCatalogHtml } from '../catalog/generate'
import { SEED_STATE_PATH, writeSeedState } from '../catalog/seedState'
import { listFlows, seedAllFlows, seedFlow } from '../index'
import { isLiveLecturePhasesEntities, isLoginAndJoinLectureEntities } from '../types'

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
  console.log('Usage: npm run seed [flow-id|all] [--no-reset] [flags]\n')
  console.log(
    '  npm run seed all          — run every flow (reset once, then append)',
  )
  console.log('  npm run seed:all          — same as above\n')
  console.log(
    '  --with-app-download       — for onboarding-fees-unpaid, pre-seeds a device token',
  )
  console.log(
    '  --docs-required           — for onboarding-fees-paid, simulated onward: documents.required = true',
  )
  console.log(
    '  --docs-uploaded           — for onboarding-fees-paid, simulated onward: documents.documentsUploaded = true',
  )
  console.log(
    '  --kit-shown               — for onboarding-fees-paid, simulated onward: kit.showKit = true',
  )
  console.log(
    '  --kit-filled              — for onboarding-fees-paid, simulated onward: kit.detailsFilled = true',
  )
  console.log(
    '  --kit-tracking            — for onboarding-fees-paid, simulated onward: kit.tracking = <url>',
  )
  console.log(
    '  --agreement-signed        — for onboarding-fees-paid, pre-signs the Program Onboarding agreement',
  )
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
  if (isLoginAndJoinLectureEntities(result.entities)) {
    console.log(`  section id:  ${result.entities.section.id}`)
    console.log(`  lecture id:  ${result.entities.lecture.id}`)
  }
  if (isLiveLecturePhasesEntities(result.entities)) {
    console.log(`  section id:  ${result.entities.section.id}`)
    console.log(`  before-unlock lecture id:       ${result.entities.lectures.beforeUnlock.id}`)
    console.log(`  during-join lecture id:         ${result.entities.lectures.duringJoin.id}`)
    console.log(`  after-no-recording lecture id:  ${result.entities.lectures.afterNoRecording.id}`)
    console.log(
      `  after-recording (attendance OFF) lecture id: ${result.entities.lectures.afterWithRecordingAttendanceOff.id}`,
    )
    console.log(
      `  after-recording (attendance ON) lecture id:  ${result.entities.lectures.afterWithRecordingAttendanceOn.id}`,
    )
    console.log(
      `  video mandatory lecture id:           ${result.entities.lectures.videoMandatory.id}`,
    )
    console.log(
      `  video optional lecture id:            ${result.entities.lectures.videoOptional.id}`,
    )
    console.log(
      `  optional live before-unlock lecture id: ${result.entities.lectures.optionalLiveBeforeUnlock.id}`,
    )
    console.log(
      `  optional live during-join lecture id:   ${result.entities.lectures.optionalLiveDuringJoin.id}`,
    )
    console.log(
      `  recording attendance OFF section id: ${result.entities.sections.recordingAttendanceOff.id}`,
    )
    console.log(
      `  recording attendance ON section id:  ${result.entities.sections.recordingAttendanceOn.id}`,
    )
  }
  console.log('\nTiming:')
  for (const [key, value] of Object.entries(result.timing)) {
    console.log(`  ${key}: ${value}`)
  }
}

function printAllResults(
  results: Awaited<ReturnType<typeof seedAllFlows>>,
): void {
  console.log(`\nSeeding completed — ${results.length} flows.\n`)
  console.table(
    results.map((result) => {
      const student =
        result.testUsers.find((user) => user.role === 'student') ??
        result.testUsers[0]
      return {
        flowId: result.flowId,
        studentEmail: student?.email ?? '',
        studentUserId: student?.userId ?? '',
        batchId: result.entities.batch.id,
      }
    }),
  )
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const flowId = args.find((arg) => !arg.startsWith('--'))
  const noReset = args.includes('--no-reset')
  const withAppDownload = args.includes('--with-app-download')
  const docsRequired = args.includes('--docs-required')
  const docsUploaded = args.includes('--docs-uploaded')
  const kitShown = args.includes('--kit-shown')
  const kitFilled = args.includes('--kit-filled')
  const kitTracking = args.includes('--kit-tracking')
  const agreementSigned = args.includes('--agreement-signed')

  if (!flowId) {
    printUsage()
    return
  }

  if (flowId === 'all') {
    console.log(`Seeding all flows${noReset ? ' (no reset)' : ''}...`)

    const results = await seedAllFlows({ reset: !noReset })
    for (let index = 0; index < results.length; index++) {
      writeSeedState(results[index], { replaceAll: !noReset && index === 0 })
    }
    publishCatalog(generateCatalogHtml())
    printAllResults(results)
    console.log('\nCatalog updated — open http://localhost:3002/seed-catalog/')
    return
  }

  console.log(`Seeding flow "${flowId}"${noReset ? ' (no reset)' : ''}...`)

  // Optional test-mode flags.
  // Keep this as process-level env so we don't have to thread new options
  // through every seedFlow signature.
  if (withAppDownload) {
    process.env.SEED_WITH_APP_DOWNLOAD = '1'
  }
  if (docsRequired) {
    process.env.SEED_DOCS_REQUIRED = '1'
  }
  if (docsUploaded) {
    process.env.SEED_DOCS_UPLOADED = '1'
  }
  if (kitShown) {
    process.env.SEED_KIT_SHOWN = '1'
  }
  if (kitFilled) {
    process.env.SEED_KIT_FILLED = '1'
  }
  if (kitTracking) {
    process.env.SEED_KIT_TRACKING = '1'
  }
  if (agreementSigned) {
    process.env.SEED_AGREEMENT_SIGNED = '1'
  }

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
