import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAgreementRenderData } from '../getAgreementRenderData.service'

const hoisted = vi.hoisted(() => ({
  queue: [] as Array<Array<Record<string, unknown>>>,
  executeRows: [] as Array<Record<string, unknown>>,
}))

// `.where()` shifts the next result set and is both awaitable (enrolled query)
// and chainable to `.limit()` (batch / user / profile queries).
vi.mock('@/db', () => {
  const where = () => {
    const rows = hoisted.queue.shift() ?? []
    return {
      limit: () => Promise.resolve(rows),
      then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
        Promise.resolve(rows).then(res, rej),
    }
  }
  const db = {
    select: () => ({ from: () => ({ where }) }),
    execute: () => Promise.resolve(hoisted.executeRows),
  }
  return { db }
})
// Student code is resolved from batch_user for the batch, never users.username.
vi.mock('@/server/users/getStudentCode', () => ({
  resolveStudentCode: vi.fn(() => Promise.resolve('MSN-001')),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getAgreementRenderData', () => {
  it('returns ordered steps, prefill (profile + prior saves), and acceptance', async () => {
    hoisted.queue = [
      [{ sectionId: 7 }], // enrolled sections
      [{ name: 'MERN', program: 'MERN Program' }], // batch
      [{ name: 'Riya', email: 'riya@example.com' }], // user
      [
        {
          birthDate: '2000-01-01',
          gender: 'FEMALE',
          legalData: {
            agreements: {
              section_7: {
                name: 'Riya Saved',
                panNumber: 'ABCDE1234F',
                acceptedSteps: { program_agreement: true },
                finalSignTime: '2024-05-01T10:00:00.000Z',
                ipAddress: '1.2.3.4',
              },
            },
          },
        },
      ], // profile
    ]
    hoisted.executeRows = [
      {
        id: 7,
        name: 'Enrolment',
        agreements: JSON.stringify({
          program_agreement: {
            heading: 'Program',
            pdfUrl: 'https://x/p.pdf',
            order: 1,
          },
          grading_policy: {
            heading: 'Grading',
            pdfUrl: 'https://x/g.pdf',
            order: 2,
          },
        }),
      },
    ]

    const [section] = await getAgreementRenderData(1, 5)

    expect(section.sectionId).toBe(7)
    expect(section.programName).toBe('MERN Program')
    expect(section.steps.map((s) => s.key)).toEqual([
      'program_agreement',
      'grading_policy',
    ])
    // Prior save overrides the profile scalar; profile fills the rest.
    expect(section.savedValues.name).toBe('Riya Saved')
    // Gender is never prefilled — the learner must pick it themselves.
    expect(section.savedValues.gender).toBeUndefined()
    // Phone country defaults to +91.
    expect(section.savedValues.parentsMobileCountry).toBe('+91')
    expect(section.savedValues.dateOfBirth).toBe('2000-01-01')
    expect(section.savedValues.panNumber).toBe('ABCDE1234F')
    expect(section.acceptedStepKeys).toEqual(['program_agreement'])
    expect(section.completed).toBe(false)
    expect(section.referenceNumber).toBe('TC-1-section_7')
    // Email from the user row; student code from the batch enrolment (batch_user).
    expect(section.email).toBe('riya@example.com')
    expect(section.studentCode).toBe('MSN-001')
    // Signature fields surfaced from stored legal data.
    expect(section.signedTime).toBe('2024-05-01T10:00:00.000Z')
    expect(section.ipAddress).toBe('1.2.3.4')
  })

  it('returns nothing when the user has no enrolled sections', async () => {
    hoisted.queue = [[]]
    expect(await getAgreementRenderData(1, 5)).toEqual([])
  })
})
