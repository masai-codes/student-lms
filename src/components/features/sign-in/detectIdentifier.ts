export type IdentifierParseFailure = 'empty' | 'invalid_email' | 'invalid_phone'

export type ParsedIdentifier =
  | { ok: true; kind: 'email'; value: string }
  | { ok: true; kind: 'phone'; display: string; digits: string }
  | { ok: false; reason: IdentifierParseFailure }

const SIMPLE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Normalizes and classifies user input as email or phone (demo rules, no network). Phone: exactly 10 digits after stripping non-digits (no country code). */
export function parseIdentifier(raw: string): ParsedIdentifier {
  const trimmed = raw.trim()
  if (trimmed.length === 0) {
    return { ok: false, reason: 'empty' }
  }
  if (trimmed.includes('@')) {
    if (SIMPLE_EMAIL.test(trimmed)) {
      return { ok: true, kind: 'email', value: trimmed.toLowerCase() }
    }
    return { ok: false, reason: 'invalid_email' }
  }
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 10) {
    return { ok: true, kind: 'phone', display: trimmed, digits }
  }
  return { ok: false, reason: 'invalid_phone' }
}

export function identifierErrorMessage(reason: IdentifierParseFailure): string {
  switch (reason) {
    case 'empty':
      return 'Enter your email or mobile number.'
    case 'invalid_email':
      return 'That email does not look valid. Check the address and try again.'
    case 'invalid_phone':
      return 'Enter a valid 10-digit mobile number (no country code), or use your email.'
  }
}

/** Short hint for OTP banner (does not expose full number). */
export function formatPhoneOtpHint(digits: string): string {
  if (digits.length <= 4) {
    return digits.replace(/\d/g, '•')
  }
  const tail = digits.slice(-4)
  return `••••${tail}`
}
