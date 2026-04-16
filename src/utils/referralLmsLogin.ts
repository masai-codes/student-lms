import { getReferralLmsLoginUrl } from '@/server/referral/referralLmsLoginServerFn'

export async function fetchReferralLmsLoginRedirectUrl(): Promise<string> {
  const data = await getReferralLmsLoginUrl()
  return data.url
}
