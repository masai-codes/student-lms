import { and, eq, isNull } from 'drizzle-orm'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { db } from '@/db'
import { profiles, sections, batches, users } from '@/db/schema'
import { generateLegalAgreementPresignedUrl } from '@/server/storage/s3Upload'

async function generateAndUploadPdf(
  userId: number,
  sectionId: number,
  certData: Record<string, string>,
  agreementPdfUrls: Array<string>,
): Promise<string> {
  const mergedPdf = await PDFDocument.create()

  // ── 1. Agreement PDFs first (in step order) ───────────────────────────────
  for (const pdfUrl of agreementPdfUrls) {
    try {
      const res = await fetch(pdfUrl)
      if (!res.ok) continue
      const bytes = await res.arrayBuffer()
      const srcPdf = await PDFDocument.load(bytes)
      const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices())
      copiedPages.forEach((p) => mergedPdf.addPage(p))
    } catch {
      // Skip unloadable PDFs — don't fail the whole operation
    }
  }

  // ── 2. Signature certificate page last ───────────────────────────────────
  const W = 595, H = 842
  const certPage = mergedPdf.addPage([W, H])
  const font = await mergedPdf.embedFont(StandardFonts.Helvetica)
  const boldFont = await mergedPdf.embedFont(StandardFonts.HelveticaBold)

  const black = rgb(0.08, 0.08, 0.08)
  const labelColor = rgb(0.15, 0.15, 0.15)
  const valueColor = rgb(0.35, 0.35, 0.35)
  const lineColor = rgb(0.88, 0.88, 0.88)

  const marginL = 60
  const marginR = 60
  const contentWidth = W - marginL - marginR
  const valueX = marginL + 180

  // "masai." top-right (brand text)
  const masaiText = 'masai.'
  const masaiSize = 22
  const masaiW = boldFont.widthOfTextAtSize(masaiText, masaiSize)
  certPage.drawText(masaiText, {
    x: W - marginR - masaiW,
    y: H - 48,
    size: masaiSize,
    font: boldFont,
    color: black,
  })

  // Program name centered (uppercase)
  const programText = (certData.program ?? '').toUpperCase()
  if (programText) {
    const programSize = 11
    const programW = boldFont.widthOfTextAtSize(programText, programSize)
    certPage.drawText(programText, {
      x: (W - programW) / 2,
      y: H - 100,
      size: programSize,
      font: boldFont,
      color: labelColor,
    })
  }

  // "SIGNATURE CERTIFICATE" title centered
  const titleText = 'SIGNATURE CERTIFICATE'
  const titleSize = 26
  const titleW = boldFont.widthOfTextAtSize(titleText, titleSize)
  certPage.drawText(titleText, {
    x: (W - titleW) / 2,
    y: H - 140,
    size: titleSize,
    font: boldFont,
    color: black,
  })

  // Divider line under title
  certPage.drawLine({
    start: { x: marginL, y: H - 158 },
    end: { x: W - marginR, y: H - 158 },
    thickness: 0.5,
    color: lineColor,
  })

  // Rows
  let y = H - 200
  const rowGapMin = 34

  function drawRow(label: string, value: string) {
    if (!value) return
    const lines = wrapText(value, contentWidth - 184, 10.5, font)
    const rowH = Math.max(lines.length * 16, rowGapMin)

    certPage.drawText(label, { x: marginL, y, size: 10.5, font: boldFont, color: labelColor })
    lines.forEach((line, i) => {
      certPage.drawText(line, { x: valueX, y: y - i * 16, size: 10.5, font, color: valueColor })
    })

    y -= rowH
    certPage.drawLine({
      start: { x: marginL, y },
      end: { x: W - marginR, y },
      thickness: 0.4,
      color: lineColor,
    })
    y -= 10
  }

  drawRow('Reference Number:', certData.referenceNumber ?? '')
  drawRow('Name:', certData.name ?? '')
  drawRow('Email:', certData.email ?? '')
  drawRow('Student Code:', certData.studentCode ?? '')
  drawRow('Address:', certData.address ?? '')
  drawRow('Program:', certData.program ?? '')
  drawRow('Section:', certData.section ?? '')
  drawRow('Viewed:', certData.viewTime ? formatDate(certData.viewTime) : '')
  drawRow('Signed:', certData.signedAt ? formatDate(certData.signedAt) : '')
  drawRow('IP Address:', certData.ipAddress ?? '')
  drawRow('Location:', certData.location ?? '')

  const pdfBytes = Buffer.from(await mergedPdf.save())

  // ── 3. Upload via presigned URL ───────────────────────────────────────────
  const timestamp = Date.now()
  const { uploadUrl, s3Url } = await generateLegalAgreementPresignedUrl(userId, sectionId, timestamp)

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    body: pdfBytes,
    headers: { 'Content-Type': 'application/pdf' },
  })
  if (!uploadRes.ok) throw new Error(`S3 upload failed: ${uploadRes.status}`)

  return s3Url
}

function wrapText(text: string, maxWidth: number, fontSize: number, font: import('pdf-lib').PDFFont): Array<string> {
  const words = text.split(' ')
  const lines: Array<string> = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    const w = font.widthOfTextAtSize(test, fontSize)
    if (w > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toString()
  } catch {
    return iso
  }
}

export async function submitAgreement(
  sectionId: number,
  userId: number,
): Promise<void> {
  const [profile] = await db
    .select({ id: profiles.id, legalData: profiles.legalData })
    .from(profiles)
    .where(and(eq(profiles.userId, userId), isNull(profiles.deletedAt)))
    .limit(1)

  if (!profile) return

  const now = new Date().toISOString()
  const legalData = (profile.legalData ?? {}) as Record<string, unknown>
  const agreements = (legalData.agreements ?? {}) as Record<string, unknown>
  const sectionKey = `section_${sectionId}`
  const existing = (agreements[sectionKey] ?? {}) as Record<string, unknown>

  // ── Write 1: immediate acceptance ─────────────────────────────────────────
  const updatedSection: Record<string, unknown> = {
    ...existing,
    haveAcceptedLegalAgreement: true,
    finalSignTime: now,
  }

  await db
    .update(profiles)
    .set({
      legalData: {
        ...legalData,
        agreements: {
          ...agreements,
          [sectionKey]: updatedSection,
        },
      },
    })
    .where(eq(profiles.id, profile.id))

  // ── Write 2: background PDF generation ───────────────────────────────────
  void (async () => {
    try {
      // Fetch section + batch + user info
      const [sectionRow] = await db
        .select({ name: sections.name, settings: sections.settings, batchId: sections.batchId })
        .from(sections)
        .where(eq(sections.id, sectionId))
        .limit(1)

      const [batchRow] = sectionRow
        ? await db
            .select({ name: batches.name, program: batches.program })
            .from(batches)
            .where(eq(batches.id, sectionRow.batchId))
            .limit(1)
        : [undefined]

      const [userRow] = await db
        .select({ email: users.email, username: users.username })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      // Collect agreement PDF URLs from section settings
      const settings = (sectionRow?.settings ?? {}) as Record<string, unknown>
      const agreementsRaw = (settings.agreements ?? {}) as Record<string, unknown>
      const pdfUrls: Array<string> = []
      for (const [key, val] of Object.entries(agreementsRaw)) {
        if (key === 'shouldModalBeVisible') continue
        const entry = val as Record<string, unknown> | null
        if (typeof entry?.pdfUrl === 'string' && entry.pdfUrl.length > 0) {
          pdfUrls.push(entry.pdfUrl)
        }
      }

      // Re-read profile to get saved section data (for cert fields)
      const [freshProfile] = await db
        .select({ legalData: profiles.legalData })
        .from(profiles)
        .where(eq(profiles.id, profile.id))
        .limit(1)

      const freshLegal = (freshProfile?.legalData ?? {}) as Record<string, unknown>
      const freshAgreements = (freshLegal.agreements ?? {}) as Record<string, unknown>
      const sectionData = (freshAgreements[sectionKey] ?? {}) as Record<string, unknown>

      const certData: Record<string, string> = {
        referenceNumber: String(sectionData.referenceNumber ?? `TC-${userId}-section_${sectionId}`),
        name: String(sectionData.name ?? ''),
        email: String(userRow?.email ?? ''),
        studentCode: String(userRow?.username ?? ''),
        address: String(sectionData.address ?? ''),
        program: String(batchRow?.program ?? ''),
        section: String(sectionRow?.name ?? ''),
        viewTime: String(freshLegal.viewTime ?? ''),
        signedAt: String(sectionData.finalSignTime ?? now),
        ipAddress: String(sectionData.ipAddress ?? ''),
        location: String(sectionData.location ?? ''),
      }

      const pdfGeneratedTime = new Date().toISOString()
      const agreementPdfUrl = await generateAndUploadPdf(userId, sectionId, certData, pdfUrls)

      // Write PDF URL back
      const [latestProfile] = await db
        .select({ id: profiles.id, legalData: profiles.legalData })
        .from(profiles)
        .where(eq(profiles.id, profile.id))
        .limit(1)

      if (latestProfile) {
        const latestLegal = (latestProfile.legalData ?? {}) as Record<string, unknown>
        const latestAgreements = (latestLegal.agreements ?? {}) as Record<string, unknown>
        const latestSection = (latestAgreements[sectionKey] ?? {}) as Record<string, unknown>

        await db
          .update(profiles)
          .set({
            legalData: {
              ...latestLegal,
              agreements: {
                ...latestAgreements,
                [sectionKey]: {
                  ...latestSection,
                  haveAcceptedLegalAgreement: true,
                  finalSignTime: now,
                  agreementPdfUrl,
                  pdfGeneratedTime,
                },
              },
            },
          })
          .where(eq(profiles.id, latestProfile.id))
      }
    } catch (err) {
      console.error('Background PDF generation failed for agreement', sectionId, err)
    }
  })()
}
