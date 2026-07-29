import { beforeEach, describe, expect, it, vi } from 'vitest'
import { submitAgreement } from '../submitAgreement.service'

const hoisted = vi.hoisted(() => ({
  selectQueue: [] as Array<Array<Record<string, unknown>>>,
  executeRows: [] as Array<Record<string, unknown>>,
  updateSet: vi.fn(),
  uploadS3: vi.fn(),
  buildPdf: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(hoisted.selectQueue.shift() ?? []),
        }),
      }),
    }),
    execute: () => Promise.resolve(hoisted.executeRows),
    update: () => ({
      set: (v: unknown) => {
        hoisted.updateSet(v)
        return { where: () => Promise.resolve() }
      },
    }),
  },
}))
vi.mock('@/server/storage/s3Upload', () => ({
  uploadImageToS3: hoisted.uploadS3,
}))
vi.mock('../buildAgreementPdf', () => ({ buildAgreementPdf: hoisted.buildPdf }))
vi.mock('@/server/restrictions/clearAgreementBan', () => ({
  clearAgreementBan: vi.fn(() => Promise.resolve()),
}))

const SECTION = {
  name: 'Enrolment',
  batch_id: 5,
  agreements: JSON.stringify({
    program_agreement: { heading: 'Program', pdfUrl: 'https://x/p.pdf' },
  }),
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      }),
    ),
  )
  hoisted.executeRows = [SECTION]
  hoisted.uploadS3.mockResolvedValue('https://s3/agreement.pdf')
  hoisted.buildPdf.mockResolvedValue(new Uint8Array([1, 2, 3]))
  // enrolled, batch, user, profile
  hoisted.selectQueue = [
    [{ id: 1 }],
    [{ name: 'MERN', program: 'MERN Program' }],
    [{ name: 'Riya', email: 'riya@x.com', username: 'riya1' }],
    [{ id: 3, legalData: {} }],
  ]
})

describe('submitAgreement', () => {
  it('rejects when the user is not enrolled in the section', async () => {
    hoisted.selectQueue = [[]]
    await expect(submitAgreement(1, 7, '1.2.3.4')).rejects.toMatchObject({
      code: 'NOT_ENROLLED_IN_SECTION',
    })
    expect(hoisted.buildPdf).not.toHaveBeenCalled()
  })

  it('generates the PDF, uploads it, and marks the agreement signed', async () => {
    const result = await submitAgreement(1, 7, '1.2.3.4')

    expect(hoisted.buildPdf).toHaveBeenCalledTimes(1)
    expect(hoisted.uploadS3).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: 'application/pdf', ext: 'pdf' }),
    )
    expect(result.agreementPdfUrl).toBe('https://s3/agreement.pdf')

    const written = hoisted.updateSet.mock.calls[0][0] as {
      legalData: { agreements: { section_7: Record<string, unknown> } }
    }
    const section = written.legalData.agreements.section_7
    expect(section.haveAcceptedLegalAgreement).toBe(true)
    expect(section.agreementPdfUrl).toBe('https://s3/agreement.pdf')
    expect(section.ipAddress).toBe('1.2.3.4')
    expect(section.acceptedSteps).toEqual({ program_agreement: true })
  })
})
