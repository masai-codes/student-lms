/**
 * Phone-number rules, shared by the profile form and the update endpoint so the
 * client hint and the server guard can never disagree.
 *
 * Ported from the old LMS: a leading 6/7/8/9 is treated as an Indian number and
 * must be exactly 10 digits; anything else is treated as international and must
 * be 7–15 digits (the E.164 subscriber range).
 */

const INDIAN_LEADING_DIGITS = ['6', '7', '8', '9']

const INDIAN_MOBILE_LENGTH = 10
const INTERNATIONAL_MOBILE_MIN_LENGTH = 7
const INTERNATIONAL_MOBILE_MAX_LENGTH = 15

export interface MobileValidationResult {
  isValid: boolean
  /** User-facing reason, present only when invalid. */
  message?: string
}

/** Strips everything that is not a digit. */
export function toDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/** Whether the number should be validated as an Indian mobile number. */
export function isIndianMobile(digits: string): boolean {
  return INDIAN_LEADING_DIGITS.includes(digits.charAt(0))
}

/** How many digits the input may hold, given what has been typed so far. */
export function maxMobileLength(digits: string): number {
  if (digits === '') return INTERNATIONAL_MOBILE_MAX_LENGTH
  return isIndianMobile(digits)
    ? INDIAN_MOBILE_LENGTH
    : INTERNATIONAL_MOBILE_MAX_LENGTH
}

/**
 * The constraint to show *before* the user trips it. The old LMS computed a
 * hint like this and then hard-coded it to an empty string, so it never showed.
 */
export function mobileHint(digits: string): string {
  if (digits === '') return 'Indian numbers are 10 digits; others 7–15.'
  return isIndianMobile(digits)
    ? `${INDIAN_MOBILE_LENGTH} digits required`
    : `${INTERNATIONAL_MOBILE_MIN_LENGTH}–${INTERNATIONAL_MOBILE_MAX_LENGTH} digits required`
}

export function validateMobile(value: string): MobileValidationResult {
  const digits = toDigits(value)

  if (digits === '') {
    return { isValid: false, message: 'Please enter a phone number' }
  }

  if (isIndianMobile(digits)) {
    return digits.length === INDIAN_MOBILE_LENGTH
      ? { isValid: true }
      : {
          isValid: false,
          message: `Indian phone number must be exactly ${INDIAN_MOBILE_LENGTH} digits`,
        }
  }

  if (digits.length < INTERNATIONAL_MOBILE_MIN_LENGTH) {
    return {
      isValid: false,
      message: `International phone number must be at least ${INTERNATIONAL_MOBILE_MIN_LENGTH} digits`,
    }
  }

  if (digits.length > INTERNATIONAL_MOBILE_MAX_LENGTH) {
    return {
      isValid: false,
      message: `International phone number cannot exceed ${INTERNATIONAL_MOBILE_MAX_LENGTH} digits`,
    }
  }

  return { isValid: true }
}
