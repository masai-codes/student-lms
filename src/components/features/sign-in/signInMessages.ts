/** Copy shown after user requests email OTP (matches a typical product email). */
export function emailOtpSentBody(email: string): string {
  return `We sent a sign-in code to ${email}. It usually arrives within a minute—check your inbox and spam or promotions. If you still don't see it, tap Resend OTP.`
}

export function emailOtpResentBody(email: string): string {
  return `Another sign-in code was sent to ${email}. Use the newest code only.`
}

/** First OTP send after phone identifier; `delivery` comes from the server. */
export function phoneOtpFirstSendBody(delivery: 'sms' | 'whatsapp', display: string): string {
  if (delivery === 'whatsapp') {
    return `We sent a sign-in code on WhatsApp to ${display}. Open WhatsApp and enter it below when it arrives. If you still don't see it, tap Resend OTP.`
  }
  return `We sent a sign-in code by text message to ${display}. Enter it below when it arrives. If you still don't see it, tap Resend OTP.`
}

export function phoneOtpResentBody(delivery: 'sms' | 'whatsapp', display: string): string {
  const channel = delivery === 'sms' ? 'text message' : 'WhatsApp'
  return `Another sign-in code was sent by ${channel} to ${display}. Use the newest code only.`
}
