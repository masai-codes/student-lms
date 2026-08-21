import { describe, expect, it } from 'vitest'
import {
  describeUserAgent,
  resolveDeviceKind,
} from '@/server/api/profile/parseUserAgent'

const CHROME_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const SAFARI_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const SAFARI_IPAD =
  'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const CHROME_ANDROID_PHONE =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
const CHROME_ANDROID_TABLET =
  'Mozilla/5.0 (Linux; Android 13; SM-X200) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const EDGE_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
const FIREFOX_LINUX =
  'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0'

describe('resolveDeviceKind', () => {
  it('detects a laptop for a desktop UA', () => {
    expect(resolveDeviceKind(CHROME_MAC)).toBe('laptop')
  })

  it('detects a phone for iPhone and mobile Android', () => {
    expect(resolveDeviceKind(SAFARI_IPHONE)).toBe('phone')
    expect(resolveDeviceKind(CHROME_ANDROID_PHONE)).toBe('phone')
  })

  it('detects a tablet for iPad and non-mobile Android', () => {
    expect(resolveDeviceKind(SAFARI_IPAD)).toBe('tablet')
    expect(resolveDeviceKind(CHROME_ANDROID_TABLET)).toBe('tablet')
  })

  it('falls back to laptop for an empty UA', () => {
    expect(resolveDeviceKind('')).toBe('laptop')
  })

  it('detects a phone for Windows Phone', () => {
    expect(resolveDeviceKind('Mozilla/5.0 (Windows Phone 10.0)')).toBe('phone')
  })
})

describe('describeUserAgent', () => {
  it('names browser and OS together', () => {
    expect(describeUserAgent(CHROME_MAC)).toBe('Chrome 120 on macOS')
  })

  it('prefers Edge over the Chrome token it also carries', () => {
    expect(describeUserAgent(EDGE_WINDOWS)).toBe('Edge 120 on Windows')
  })

  it('prefers Chrome over the Safari token it also carries', () => {
    expect(describeUserAgent(CHROME_ANDROID_PHONE)).toBe(
      'Chrome 120 on Android',
    )
  })

  it('recognises Safari on iOS', () => {
    expect(describeUserAgent(SAFARI_IPHONE)).toBe('Safari 17 on iOS')
  })

  it('recognises iPadOS separately from iOS', () => {
    expect(describeUserAgent(SAFARI_IPAD)).toBe('Safari 17 on iPadOS')
  })

  it('recognises Firefox on Linux', () => {
    expect(describeUserAgent(FIREFOX_LINUX)).toBe('Firefox 121 on Linux')
  })

  it('recognises Opera and Samsung Internet', () => {
    expect(describeUserAgent('OPR/105.0 Windows NT 10.0')).toBe(
      'Opera 105 on Windows',
    )
    expect(describeUserAgent('SamsungBrowser/23.0 Android')).toBe(
      'Samsung Internet 23 on Android',
    )
  })

  it('falls back to the OS alone when no browser matches', () => {
    expect(describeUserAgent('SomeBot/1.0 (Windows NT 10.0)')).toBe('Windows')
  })

  it('falls back to the browser alone when no OS matches', () => {
    expect(describeUserAgent('Firefox/121.0')).toBe('Firefox 121')
  })

  it('handles a null, empty or unrecognised UA', () => {
    expect(describeUserAgent(null)).toBe('Unknown device')
    expect(describeUserAgent('   ')).toBe('Unknown device')
    expect(describeUserAgent('curl/8.1.2')).toBe('Unknown device')
  })
})
