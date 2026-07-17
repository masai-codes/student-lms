// Hardcoded "Masai Live" promo banner shown as the always-first slide in the
// dashboard welcome carousel (see WelcomeBannerCarousel). Unlike the DB-driven
// banners this one is fixed in code, has its own distinct design, and never
// rotates out. Edit the two TODO values below to point the card at the real
// asset + destination — everything else is copy/analytics config.
export const MASAI_LIVE_PROMO = {
  imageUrl:
    'https://s3.ap-south-1.amazonaws.com/static.masaischool.com/banner_image.png',
  // A value starting with `/` is treated as an internal same-tab route;
  // a full URL (like this one) opens in a new tab.
  ctaUrl:
    'https://masai-live.masaischool.com/cd/afnFk0_Po9vgQKzf/session/akeYwZiFm3TFUV-h?pl=akeXhJiFm3TFUV8w&join=1',

  label: 'This Month On',
  brand: 'masai',
  brandAccent: 'live.',
  title: 'Build Your Second AI Brain',
  subtitle: 'with Saksham Arora, Ex- Microsoft',
  ctaText: 'Join for Free',
  /** Segment embedded in the GTM click event name. */
  analyticsKey: 'masai_live_build_second_ai_brain',
} as const
