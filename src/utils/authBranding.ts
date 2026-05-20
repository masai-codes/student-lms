import { getConfiguredAppOrigin, type AppOrigin } from '@/utils/appOrigin'

export type AuthBranding = {
  logoSrc: string
  logoAlt: string
  logoClassName: string
  accountPrompt: string
  footerLabel: string
  footerHref: string
}

const BRANDING: Record<AppOrigin, AuthBranding> = {
  masai: {
    logoSrc: '/masai-logo.svg',
    logoAlt: 'Masai School',
    logoClassName: 'mx-auto h-10 w-auto cursor-pointer md:h-11',
    accountPrompt: 'Continue with your Masai account.',
    footerLabel: 'Masai School',
    footerHref: 'https://masaischool.com/',
  },
  ihub: {
    logoSrc: '/ihub-logo.png',
    logoAlt: 'i-HUB Divyasampark',
    logoClassName: 'mx-auto h-14 w-14 cursor-pointer object-contain md:h-16 md:w-16',
    accountPrompt: 'Continue with your IHub IITR Courses account.',
    footerLabel: 'IHub IITR Courses',
    footerHref: 'https://courses.ihubiitrcourses.org',
  },
}

export function getAuthBranding(origin: AppOrigin = getConfiguredAppOrigin()): AuthBranding {
  return BRANDING[origin]
}
