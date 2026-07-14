import { describe, expect, it } from 'vitest'
import {
  emailOtpResentBody,
  emailOtpSentBody,
  phoneOtpFirstSendBody,
  phoneOtpResentBody,
} from '@/components/features/sign-in/signInMessages'

describe('signInMessages', () => {
  it('emailOtpSentBody includes the address', () => {
    expect(emailOtpSentBody('a@b.com')).toContain('a@b.com')
    expect(emailOtpSentBody('a@b.com')).toMatch(/sign-in code|inbox/i)
    expect(emailOtpSentBody('a@b.com')).toMatch(/resend otp/i)
  })

  it('emailOtpResentBody includes the address', () => {
    expect(emailOtpResentBody('a@b.com')).toContain('a@b.com')
    expect(emailOtpResentBody('a@b.com')).toMatch(/newest code/i)
  })

  it('phoneOtpFirstSendBody references display (SMS)', () => {
    const s = phoneOtpFirstSendBody('sms', '98765 43210')
    expect(s).toContain('98765 43210')
    expect(s).toMatch(/text message/i)
    expect(s).not.toMatch(/••|ends in/i)
  })

  it('phoneOtpFirstSendBody names WhatsApp when delivery is whatsapp', () => {
    const s = phoneOtpFirstSendBody('whatsapp', '9000000000')
    expect(s).toMatch(/WhatsApp/i)
    expect(s).toContain('9000000000')
  })

  it('phoneOtpResentBody names the channel', () => {
    expect(phoneOtpResentBody('sms', '9000000000')).toMatch(
      /text message|SMS|Another/i,
    )
    expect(phoneOtpResentBody('sms', '9000000000')).not.toMatch(/ends in/i)
  })
})
