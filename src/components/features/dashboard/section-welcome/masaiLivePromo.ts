// Hardcoded "Masai Live" promo banner shown as the always-first slide in the
// dashboard welcome carousel (see WelcomeBannerCarousel). Unlike the DB-driven
// banners this one is fixed in code, has its own distinct design, and never
// rotates out. The CTA hits our SSO bridge so admissions `connect.sid` is set
// on the shared cookie domain before the browser lands on Masai Live.
const MASAI_LIVE_DESTINATION =
  'https://masai-live.masaischool.com/cd/afnGM0_Po9vgQK0k/session/amsdHg5OQ9bgNjQq?pl=amsb5Q5OQ9bgNjOA&join=1'

export const MASAI_LIVE_PROMO = {
  imageUrl:
    'https://s3.ap-south-1.amazonaws.com/static.masaischool.com/banner_image_2.png',
  // Same-tab `/api/...` so the GET login can Set-Cookie then 302 to Masai Live.
  ctaUrl: `/api/user-auth/masai-live-login?redirect=${encodeURIComponent(MASAI_LIVE_DESTINATION)}`,

  label: 'This Month On',
  brand: 'masai',
  brandAccent: 'live.',
  title: 'Loop Engineering: AI Career Intelligence Agent',
  subtitle: 'with Tanishq Gupta, SDE 2, Amazon',
  ctaText: 'Join for Free',
  /** Segment embedded in the GTM click event name. */
  analyticsKey: 'masai_live_build_second_ai_brain',
} as const
