/** Mock: real backend will choose channel; randomize until the send-OTP API is wired. */
export function randomPhoneDelivery(): 'sms' | 'whatsapp' {
  return Math.random() < 0.5 ? 'sms' : 'whatsapp'
}
