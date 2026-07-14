import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { buildAgreementPdf } from '../buildAgreementPdf'

const certData = {
  referenceNumber: 'TC-1-section_7',
  name: 'Riya',
  email: 'riya@example.com',
  studentCode: 'riya1',
  address:
    '12 MG Rd, Bengaluru — a deliberately long address to exercise line wrapping on the certificate page',
  program: 'MERN',
  sectionName: 'Enrolment',
  viewed: '2026-07-01T10:00:00.000Z',
  signed: '2026-07-05T10:00:00.000Z',
  ipAddress: '1.2.3.4',
  location: 'Bengaluru',
}

async function makePdfBytes(): Promise<ArrayBuffer> {
  const doc = await PDFDocument.create()
  doc.addPage([595, 842])
  const bytes = await doc.save()
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer
}

describe('buildAgreementPdf', () => {
  it('merges the agreement doc and appends a certificate page (logo optional)', async () => {
    const docBytes = await makePdfBytes()
    const out = await buildAgreementPdf(
      [{ heading: 'Program', bytes: docBytes }],
      certData,
      null,
    )

    const result = await PDFDocument.load(out)
    // 1 source page + 1 signature-certificate page.
    expect(result.getPageCount()).toBe(2)
    expect(out.byteLength).toBeGreaterThan(0)
  })

  it('skips an unloadable agreement doc but still produces the certificate', async () => {
    const out = await buildAgreementPdf(
      [{ heading: 'Broken', bytes: new ArrayBuffer(4) }],
      certData,
      null,
    )
    const result = await PDFDocument.load(out)
    expect(result.getPageCount()).toBe(1) // only the certificate page
  })
})
