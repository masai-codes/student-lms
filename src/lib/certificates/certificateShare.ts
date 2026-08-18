/**
 * Certificate viewing/sharing rules, shared by the profile and course surfaces.
 *
 * Ported from the old LMS's `Profile/NewCertificates/index.tsx`, which is the
 * reference behaviour: a certificate is only *viewable* when it has a real
 * http(s) URL, but it is always *shareable* (the post text stands on its own and
 * simply omits the verify link when there isn't one).
 */

/**
 * Narrows a stored value to a URL that is safe to put in an `iframe src` or an
 * anchor `href`. Anything that isn't absolute http(s) — a relative path, a
 * `javascript:` URL, or free text like a LinkedIn caption — returns null.
 */
export function asHttpUrl(value: string | null | undefined): string | null {
  const candidate = value?.trim()
  if (!candidate) return null

  try {
    const parsed = new URL(candidate)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return candidate
  } catch {
    return null
  }
}

export interface CertificateShareInput {
  certificateTitle: string | null
  certificateType: string | null
  verificationUrl: string | null
}

/**
 * LinkedIn post copy. Mirrors the old LMS's `buildLinkedinText` so a student's
 * post reads the same after the migration.
 */
export function buildCertificateShareText(
  certificate: CertificateShareInput,
): string {
  const title = certificate.certificateTitle?.trim() || 'Certificate'
  const type = certificate.certificateType?.trim() || 'General'
  const verifyUrl = asHttpUrl(certificate.verificationUrl)

  return (
    `I am excited to share my ${title} (${type}) certificate.` +
    (verifyUrl ? ` Verify it here: ${verifyUrl}` : '')
  )
}

/** LinkedIn's share-offsite composer, pre-filled with the post text. */
export function buildLinkedInShareUrl(text: string): string {
  return `https://www.linkedin.com/sharing/share-offsite?text=${encodeURIComponent(text)}`
}

/**
 * The URL the "View" modal should render, or null when there is nothing
 * displayable. Prefers the public verification page (what the old LMS shows)
 * and falls back to the signed certificate file.
 */
export function resolveViewableCertificateUrl(certificate: {
  verificationUrl: string | null
  pdfUrl: string | null
}): string | null {
  return (
    asHttpUrl(certificate.verificationUrl) ?? asHttpUrl(certificate.pdfUrl)
  )
}
