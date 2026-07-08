import { describe, expect, it } from 'vitest'
import { buildAgreementSteps, buildReferenceNumber, hasSignableAgreement } from '../agreementShared'

describe('buildAgreementSteps', () => {
  it('drops reserved keys and hidden/invalid docs', () => {
    const steps = buildAgreementSteps({
      shouldModalBeVisible: true,
      program_agreement: { heading: 'Program', pdfUrl: 'https://x/p.pdf' },
      secret: { heading: 'Hidden', pdfUrl: 'https://x/h.pdf', hidePolicy: true },
      broken: { heading: '', pdfUrl: 'https://x/b.pdf' },
    })
    expect(steps.map((s) => s.key)).toEqual(['program_agreement'])
  })

  it('orders unordered before ordered, then ascending by order', () => {
    const steps = buildAgreementSteps({
      posh: { heading: 'POSH', pdfUrl: 'u', order: 2 },
      program_agreement: { heading: 'Program', pdfUrl: 'u' }, // unordered
      grading: { heading: 'Grading', pdfUrl: 'u', order: 1 },
    })
    expect(steps.map((s) => s.key)).toEqual(['program_agreement', 'grading', 'posh'])
  })

  it('falls back to the default order for unordered known keys', () => {
    const steps = buildAgreementSteps({
      posh_compliance: { heading: 'POSH', pdfUrl: 'u' },
      program_agreement: { heading: 'Program', pdfUrl: 'u' },
      grading_policy: { heading: 'Grading', pdfUrl: 'u' },
    })
    expect(steps.map((s) => s.key)).toEqual(['program_agreement', 'grading_policy', 'posh_compliance'])
  })
})

describe('hasSignableAgreement / buildReferenceNumber', () => {
  it('detects a signable agreement', () => {
    expect(hasSignableAgreement({ shouldModalBeVisible: true })).toBe(false)
    expect(hasSignableAgreement({ program_agreement: { heading: 'P', pdfUrl: 'u' } })).toBe(true)
    expect(hasSignableAgreement(null)).toBe(false)
  })

  it('builds the TC reference number', () => {
    expect(buildReferenceNumber(42, 7)).toBe('TC-42-section_7')
  })
})
