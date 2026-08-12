import type { AppOrigin } from '@/utils/appOrigin'
import { getAppOrigin } from '@/utils/appOrigin'

/**
 * IIT Jodhpur crest + "Powered by masai" lockup. Two artworks: the light one has
 * a navy/black wordmark, the dark one a white wordmark (the crest keeps its
 * brand colours in both, so it must not be recoloured with `dark:invert`).
 */
export const IITJ_LOGO_LIGHT_URL =
  'https://s3.ap-south-1.amazonaws.com/static.masaischool.com/iitj_masai_light.png'
export const IITJ_LOGO_DARK_URL =
  'https://s3.ap-south-1.amazonaws.com/static.masaischool.com/iitj_masai_dark.png'

export type AuthBranding = {
  logoSrc: string
  /**
   * Purpose-made dark-theme artwork (white wordmark), when the portal has one.
   * Undefined means `logoSrc` works on both themes (or is recoloured via
   * `logoClassName`), so callers should fall back to it.
   */
  logoDarkSrc?: string
  logoAlt: string
  logoClassName: string
  pageTitle: string
  /** `<meta name="description">` for the portal. */
  metaDescription: string
  signInHeading: string
  accountPrompt: string
  footerLabel: string
  footerHref: string
  showLegalLinks: boolean
  /** Attribution shown in the app footer ("Crafted by …"). */
  craftedBy: string
}

const BRANDING: Record<AppOrigin, AuthBranding> = {
  masai: {
    logoSrc: '/masai-logo.svg',
    logoAlt: 'Masai School',
    // The SVG's fills are near-black; flatten to white in dark so the
    // wordmark stays visible on the near-black auth backdrop.
    logoClassName:
      'mx-auto h-10 w-auto cursor-pointer md:h-11 dark:brightness-0 dark:invert',
    pageTitle: 'Masai LMS',
    metaDescription:
      'Masai School learning platform — programs, live sessions and placements.',
    signInHeading: 'Sign in',
    accountPrompt: 'Continue with your Masai account.',
    footerLabel: 'Masai School',
    footerHref: 'https://masaischool.com/',
    showLegalLinks: true,
    craftedBy: 'Masai School',
  },
  ihub: {
    logoSrc: '/ihub-logo.png',
    logoAlt: 'i-HUB Divyasampark',
    logoClassName:
      'mx-auto h-14 w-14 cursor-pointer object-contain md:h-16 md:w-16',
    pageTitle: 'iHub DivyaSampark',
    metaDescription:
      'iHub DivyaSampark learning platform — programs and live sessions.',
    signInHeading: 'iHub DivyaSampark',
    accountPrompt: 'Continue with your IHub IITR Courses account.',
    footerLabel: 'IHub IITR Courses',
    footerHref: 'https://courses.ihubiitrcourses.org',
    showLegalLinks: false,
    craftedBy: 'iHub DivyaSampark',
  },
  iitj: {
    logoSrc: IITJ_LOGO_LIGHT_URL,
    logoDarkSrc: IITJ_LOGO_DARK_URL,
    logoAlt: 'IIT Jodhpur',
    logoClassName: 'mx-auto h-14 w-auto cursor-pointer object-contain md:h-16',
    pageTitle: 'IIT Jodhpur',
    metaDescription:
      'IIT Jodhpur learning platform — programs and live sessions.',
    signInHeading: 'IIT Jodhpur',
    accountPrompt: 'Continue with your IIT Jodhpur account.',
    footerLabel: 'IIT Jodhpur',
    footerHref: 'https://www.iitj.ac.in/',
    showLegalLinks: false,
    craftedBy: 'IIT Jodhpur',
  },
}

export function getAuthBranding(
  origin: AppOrigin = getAppOrigin(),
): AuthBranding {
  return BRANDING[origin]
}
