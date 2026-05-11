/** Copy shown after user requests email OTP (matches a typical product email). */
export function emailOtpSentBody(email: string): string {
  return `We sent a 6-digit code to ${email}. It usually arrives within a minute—check your inbox and spam or promotions. Each code expires in 10 minutes.`
}

/** First OTP send after phone identifier; `delivery` comes from the server (mock: random). */
export function phoneOtpFirstSendBody(delivery: 'sms' | 'whatsapp', display: string): string {
  if (delivery === 'whatsapp') {
    return `We sent a 6-digit code on WhatsApp to ${display}. Open WhatsApp and enter it below when it arrives. If you still don't see it, tap Resend OTP.`
  }
  return `We sent a 6-digit code by text message to ${display}. Enter it below when it arrives. If you still don't see it, tap Resend OTP.`
}

export function phoneOtpResentBody(delivery: 'sms' | 'whatsapp', display: string): string {
  const channel = delivery === 'sms' ? 'text message' : 'WhatsApp'
  return `Another 6-digit code was sent by ${channel} to ${display}. Use the newest code only.`
}
