import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { PDFFont } from 'pdf-lib'

export interface AgreementPdfDoc {
  heading: string
  /** Raw bytes of the agreement PDF (already fetched). */
  bytes: ArrayBuffer
}

export interface AgreementCertData {
  referenceNumber: string
  name: string
  email: string
  studentCode: string
  panNumber?: string
  passportNumber?: string
  address: string
  program: string
  sectionName: string
  viewed: string
  signed: string
  ipAddress: string
  location: string
}

const A4: [number, number] = [595.276, 841.89]

/** Wrap `text` to lines that fit `maxWidth` at `size` using `font`. */
function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): Array<string> {
  const words = text.split(/\s+/)
  const lines: Array<string> = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines.length ? lines : ['']
}

/**
 * Builds the signed agreement PDF exactly like the old LMS: each agreement PDF's
 * pages are appended with a "<heading> Signed At: <signed>" line on its last
 * page, then a final SIGNATURE CERTIFICATE page (logo + program + a details
 * table). Returns the merged PDF bytes.
 */
export async function buildAgreementPdf(
  docs: Array<AgreementPdfDoc>,
  certData: AgreementCertData,
  logoBytes: ArrayBuffer | null,
): Promise<Uint8Array> {
  const merged = await PDFDocument.create()
  const bold = await merged.embedFont(StandardFonts.HelveticaBold)
  const regular = await merged.embedFont(StandardFonts.Helvetica)

  for (const doc of docs) {
    let src: PDFDocument
    try {
      src = await PDFDocument.load(doc.bytes)
    } catch {
      continue // skip an unloadable agreement PDF rather than fail the whole submit
    }
    const pages = await merged.copyPages(src, src.getPageIndices())
    pages.forEach((page, i) => {
      merged.addPage(page)
      if (i === pages.length - 1) {
        const { width } = page.getSize()
        page.drawRectangle({
          x: 40,
          y: 40,
          width: width - 80,
          height: 30,
          color: rgb(1, 1, 1),
        })
        page.drawText(`${doc.heading} Signed At: ${certData.signed}`, {
          x: 50,
          y: 50,
          size: 10,
          font: bold,
          color: rgb(0, 0, 0),
        })
      }
    })
  }

  // ── Signature certificate page ────────────────────────────────────────────
  const page = merged.addPage(A4)
  const { width, height } = page.getSize()
  let logoH = 0
  if (logoBytes) {
    try {
      const logo = await merged.embedPng(logoBytes)
      const logoW = 100
      logoH = (logoW * logo.height) / logo.width
      page.drawImage(logo, {
        x: width - logoW - 20,
        y: height - logoH - 15,
        width: logoW,
        height: logoH,
      })
    } catch {
      logoH = 0 // unusable logo — render the certificate without it
    }
  }

  const program = certData.program.toUpperCase()
  page.drawText(program, {
    x: (width - bold.widthOfTextAtSize(program, 14)) / 2,
    y: height - logoH - 35,
    size: 14,
    font: bold,
    color: rgb(0, 0, 0),
  })
  const title = 'SIGNATURE CERTIFICATE'
  page.drawText(title, {
    x: (width - bold.widthOfTextAtSize(title, 20)) / 2,
    y: height - logoH - 80,
    size: 20,
    font: bold,
    color: rgb(0, 0, 0),
  })

  const labelX = 50
  const valueX = 200
  const maxValueWidth = width - valueX - 50
  const lineHeight = 30
  let y = height - logoH - 170
  // Drop non-ASCII so the standard PDF fonts (WinAnsi) can encode every glyph.
  // eslint-disable-next-line no-control-regex
  const sanitize = (t: string) => t.replace(/[^\x00-\x7F]/g, '')

  const addRow = (label: string, value: string) => {
    page.drawText(`${label}:`, {
      x: labelX,
      y,
      size: 12,
      font: bold,
      color: rgb(0, 0, 0),
    })
    const lines = wrapText(sanitize(value || ''), regular, 12, maxValueWidth)
    lines.forEach((line, i) => {
      page.drawText(line, {
        x: valueX,
        y: y - i * 14,
        size: 12,
        font: regular,
        color: rgb(0, 0, 0),
      })
    })
    y -= lineHeight + Math.max(0, lines.length - 1) * 14
  }

  addRow('Reference Number', certData.referenceNumber)
  addRow('Name', certData.name)
  addRow('Email', certData.email)
  addRow('Student Code', certData.studentCode)
  if (certData.panNumber) addRow('PAN Number', certData.panNumber)
  if (certData.passportNumber)
    addRow('Passport Number', certData.passportNumber)
  addRow('Address', certData.address)
  addRow('Program', certData.program)
  addRow('Section', certData.sectionName)
  addRow('Viewed', certData.viewed)
  addRow('Signed', certData.signed)
  addRow('IP Address', certData.ipAddress)
  addRow('Location', certData.location)

  return merged.save()
}
