import type { EmailPortal } from '@/server/auth/v2/isRequestFromIHub'

const ENDPOINT = 'https://backend.api-wa.co/campaign/serri-india/api/v2'
const SOURCE = 'lms-v2-login'
const SEND_TIMEOUT_MS = 10_000

type PortalAisensyConfig = {
  apiKeyEnvVar: string
  campaignName: string
  userName: string
}

const PORTAL_CONFIG: Record<EmailPortal, PortalAisensyConfig> = {
  masai: {
    apiKeyEnvVar: 'WHATSAPP_SERRI_API_KEY_MASAI',
    campaignName: 'otp_masai_saharan',
    userName: 'IIT Online Programs 19',
  },
  ihub: {
    apiKeyEnvVar: 'WHATSAPP_SERRI_API_KEY_IHUB',
    campaignName: 'otp_prepleaf_01',
    userName: 'IIT Online Programs 23',
  },
  // IIT Jodhpur has no dedicated WhatsApp campaign yet — reuse the Masai config
  // as the v1 fallback. Swap in an IITJ-specific campaign when one is provisioned.
  iitj: {
    apiKeyEnvVar: 'WHATSAPP_SERRI_API_KEY_MASAI',
    campaignName: 'otp_masai_saharan',
    userName: 'IIT Online Programs 19',
  },
}

function getApiKey(envVar: string): string {
  const key = process.env[envVar]?.trim()
  if (!key) {
    throw new Error(`${envVar} env var is not set`)
  }
  return key
}

function normalizeForAisensy(input: string): string {
  const cleaned = input.trim().replace(/^\+/, '')
  if (/^91\d{10}$/.test(cleaned)) return cleaned
  if (/^\d{10}$/.test(cleaned)) return `91${cleaned}`
  throw new Error(`Invalid Indian mobile for WhatsApp: ${input}`)
}

export type SendOtpWhatsappArgs = {
  mobile: string
  otp: string
  portal: EmailPortal
}

export async function sendOtpWhatsapp({
  mobile,
  otp,
  portal,
}: SendOtpWhatsappArgs): Promise<void> {
  const destination = normalizeForAisensy(mobile)
  const config = PORTAL_CONFIG[portal]

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: getApiKey(config.apiKeyEnvVar),
        campaignName: config.campaignName,
        destination,
        userName: config.userName,
        templateParams: [otp],
        source: SOURCE,
        media: {},
        buttons: [
          {
            type: 'button',
            sub_type: 'url',
            index: 0,
            parameters: [{ type: 'text', text: otp }],
          },
        ],
        carouselCards: [],
        location: {},
        attributes: {},
        paramsFallbackValue: { FirstName: 'user' },
      }),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`AISensy WhatsApp send failed: ${response.status} ${text}`)
  }
}
