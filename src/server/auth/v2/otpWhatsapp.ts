const ENDPOINT = 'https://backend.api-wa.co/campaign/serri-india/api/v2'
const CAMPAIGN_NAME = 'otp_masai_saharan'
const USER_NAME = 'IIT Online Programs 19'
const SOURCE = 'lms-v2-login'
const SEND_TIMEOUT_MS = 10_000

function getApiKey(): string {
  const key = process.env.WHATSAPP_SERRI_API_KEY?.trim()
  if (!key) {
    throw new Error('WHATSAPP_SERRI_API_KEY env var is not set')
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
}

export async function sendOtpWhatsapp({ mobile, otp }: SendOtpWhatsappArgs): Promise<void> {
  const destination = normalizeForAisensy(mobile)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: getApiKey(),
        campaignName: CAMPAIGN_NAME,
        destination,
        userName: USER_NAME,
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
