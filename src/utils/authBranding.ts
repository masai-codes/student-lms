import type { AppOrigin } from '@/utils/appOrigin'
import { getAppOrigin } from '@/utils/appOrigin'

export type AuthBranding = {
  logoSrc: string
  logoAlt: string
  logoClassName: string
  pageTitle: string
  signInHeading: string
  accountPrompt: string
  footerLabel: string
  footerHref: string
  showLegalLinks: boolean
}

const BRANDING: Record<AppOrigin, AuthBranding> = {
  masai: {
    logoSrc: '/masai-logo.svg',
    logoAlt: 'Masai School',
    logoClassName: 'mx-auto h-10 w-auto cursor-pointer md:h-11',
    pageTitle: 'Masai LMS',
    signInHeading: 'Sign in',
    accountPrompt: 'Continue with your Masai account.',
    footerLabel: 'Masai School',
    footerHref: 'https://masaischool.com/',
    showLegalLinks: true,
  },
  ihub: {
    logoSrc: '/ihub-logo.png',
    logoAlt: 'i-HUB Divyasampark',
    logoClassName: 'mx-auto h-14 w-14 cursor-pointer object-contain md:h-16 md:w-16',
    pageTitle: 'iHub DivyaSampark',
    signInHeading: 'iHub DivyaSampark',
    accountPrompt: 'Continue with your IHub IITR Courses account.',
    footerLabel: 'IHub IITR Courses',
    footerHref: 'https://courses.ihubiitrcourses.org',
    showLegalLinks: false,
  },
}

export function getAuthBranding(origin: AppOrigin = getAppOrigin()): AuthBranding {
  return BRANDING[origin]
}
