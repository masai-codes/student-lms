import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  rows: [] as Array<{ programDomain: string | null; program: string | null }>,
}))

vi.mock('@/db', () => {
  const chain = {
    select: () => chain,
    from: () => chain,
    innerJoin: () => chain,
    where: () => chain,
    orderBy: () => chain,
    limit: () => Promise.resolve(hoisted.rows),
  }
  return { db: chain }
})

vi.mock('@/server/batches/portalBatchScope', () => ({
  batchScopeForPortal: () => undefined,
}))

describe('classifyProgramText', () => {
  it('classifies data/ai/ml keywords', async () => {
    const { classifyProgramText } = await import('../resolveInterviewDomain')
    expect(classifyProgramText('Data Science')).toBe('data-ai-ml')
    expect(classifyProgramText('AI/ML')).toBe('data-ai-ml')
    expect(classifyProgramText('Analytics')).toBe('data-ai-ml')
  })

  it('classifies product management keywords', async () => {
    const { classifyProgramText } = await import('../resolveInterviewDomain')
    expect(classifyProgramText('Product Management')).toBe('product-management')
    expect(classifyProgramText('PM')).toBe('product-management')
  })

  it('falls back to software-development for anything else', async () => {
    const { classifyProgramText } = await import('../resolveInterviewDomain')
    expect(classifyProgramText('SDE')).toBe('software-development')
    expect(classifyProgramText('FT')).toBe('software-development')
  })

  it('returns null for empty/blank text', async () => {
    const { classifyProgramText } = await import('../resolveInterviewDomain')
    expect(classifyProgramText(null)).toBeNull()
    expect(classifyProgramText(undefined)).toBeNull()
    expect(classifyProgramText('   ')).toBeNull()
  })
})

describe('resolveInterviewDomain', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns general when the user has no active enrollment', async () => {
    hoisted.rows = []
    const { resolveInterviewDomain } = await import('../resolveInterviewDomain')
    expect(await resolveInterviewDomain(1)).toBe('general')
  })

  it('prefers programDomain over program when both present', async () => {
    hoisted.rows = [{ programDomain: 'Product', program: 'Data Science' }]
    const { resolveInterviewDomain } = await import('../resolveInterviewDomain')
    expect(await resolveInterviewDomain(1)).toBe('product-management')
  })

  it('falls back to program when programDomain is empty', async () => {
    hoisted.rows = [{ programDomain: null, program: 'Data Science' }]
    const { resolveInterviewDomain } = await import('../resolveInterviewDomain')
    expect(await resolveInterviewDomain(1)).toBe('data-ai-ml')
  })

  it('defaults to software-development for unrecognized program text', async () => {
    hoisted.rows = [{ programDomain: null, program: 'SDE' }]
    const { resolveInterviewDomain } = await import('../resolveInterviewDomain')
    expect(await resolveInterviewDomain(1)).toBe('software-development')
  })
})
