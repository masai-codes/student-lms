import { describe, expect, it } from 'vitest'
import {
  asHttpUrl,
  buildCertificateShareText,
  buildLinkedInShareUrl,
  resolveViewableCertificateUrl,
} from '@/lib/certificates/certificateShare'

describe('asHttpUrl', () => {
  it('accepts absolute http(s) URLs', () => {
    expect(asHttpUrl('https://verification.masaischool.com/certificate/abc')).toBe(
      'https://verification.masaischool.com/certificate/abc',
    )
    expect(asHttpUrl('http://example.com/x')).toBe('http://example.com/x')
  })

  it('trims surrounding whitespace', () => {
    expect(asHttpUrl('  https://example.com/x  ')).toBe('https://example.com/x')
  })

  it('rejects free text — the bug that put a LinkedIn caption in an iframe src', () => {
    expect(
      asHttpUrl(
        "Excited to share that I've successfully completed my certification 🎓",
      ),
    ).toBeNull()
  })

  it('rejects non-http schemes', () => {
    expect(asHttpUrl('javascript:alert(1)')).toBeNull()
    expect(asHttpUrl('data:text/html,<h1>x</h1>')).toBeNull()
    expect(asHttpUrl('ftp://example.com/x')).toBeNull()
  })

  it('rejects relative paths and blank/absent values', () => {
    expect(asHttpUrl('/certificate/abc')).toBeNull()
    expect(asHttpUrl('')).toBeNull()
    expect(asHttpUrl('   ')).toBeNull()
    expect(asHttpUrl(null)).toBeNull()
    expect(asHttpUrl(undefined)).toBeNull()
  })
})

describe('buildCertificateShareText', () => {
  it('matches the old LMS copy, appending the verify link', () => {
    expect(
      buildCertificateShareText({
        certificateTitle: 'Full Stack Completion',
        certificateType: 'Course Completion',
        verificationUrl: 'https://verification.masaischool.com/certificate/abc',
      }),
    ).toBe(
      'I am excited to share my Full Stack Completion (Course Completion) certificate. ' +
        'Verify it here: https://verification.masaischool.com/certificate/abc',
    )
  })

  it('omits the link when there is no valid URL, so Share still works', () => {
    expect(
      buildCertificateShareText({
        certificateTitle: 'Full Stack Completion',
        certificateType: 'Course Completion',
        verificationUrl: null,
      }),
    ).toBe(
      'I am excited to share my Full Stack Completion (Course Completion) certificate.',
    )
  })

  it('never leaks unshareable junk into the post text', () => {
    expect(
      buildCertificateShareText({
        certificateTitle: 'X',
        certificateType: 'Y',
        verificationUrl: 'not a url',
      }),
    ).toBe('I am excited to share my X (Y) certificate.')
  })

  it('falls back for a missing title or type', () => {
    expect(
      buildCertificateShareText({
        certificateTitle: null,
        certificateType: '  ',
        verificationUrl: null,
      }),
    ).toBe('I am excited to share my Certificate (General) certificate.')
  })
})

describe('buildLinkedInShareUrl', () => {
  it('percent-encodes the text into the share-offsite composer', () => {
    expect(buildLinkedInShareUrl('a b&c')).toBe(
      'https://www.linkedin.com/sharing/share-offsite?text=a%20b%26c',
    )
  })
})

describe('resolveViewableCertificateUrl', () => {
  it('prefers the verification page over the file', () => {
    expect(
      resolveViewableCertificateUrl({
        verificationUrl: 'https://verify.example/c/1',
        pdfUrl: 'https://s3.example/c.pdf',
      }),
    ).toBe('https://verify.example/c/1')
  })

  it('falls back to the signed file when there is no verification page', () => {
    expect(
      resolveViewableCertificateUrl({
        verificationUrl: null,
        pdfUrl: 'https://s3.example/c.pdf',
      }),
    ).toBe('https://s3.example/c.pdf')
  })

  it('skips an invalid verification value rather than iframing it', () => {
    expect(
      resolveViewableCertificateUrl({
        verificationUrl: 'LinkedIn caption text',
        pdfUrl: 'https://s3.example/c.pdf',
      }),
    ).toBe('https://s3.example/c.pdf')
  })

  it('returns null when nothing is displayable', () => {
    expect(
      resolveViewableCertificateUrl({ verificationUrl: null, pdfUrl: null }),
    ).toBeNull()
  })
})
