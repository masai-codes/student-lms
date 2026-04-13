export type ScrollingBannerItem = {
  id?: string;
  heading: string;
  content: string;
  ctaText?: string;
  ctaLink?: string;
  openInNewTab?: boolean;
};

export type ScrollingBannerProps = {
  items: ScrollingBannerItem[];
  bannerHeading?: string;
  className?: string;
  maxHeight?: number | string;
  maxWidth?: number | string;
  autoScroll?: boolean;
  itemDurationSeconds?: number;
  pauseOnHover?: boolean;
  allowManualScroll?: boolean;
  ariaLabel?: string;
};
