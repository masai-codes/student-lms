// @vitest-environment jsdom
// @vitest-environment-options { "url": "https://students-demo-v2.ihubiitrcourses.org/signin" }
import { describe, expect, it } from 'vitest'
import { getAppOrigin, originFromHost, withAppOriginHeader } from '@/utils/appOrigin'

describe('originFromHost', () => {
  it('treats any host containing "ihub" as ihub', () => {
    expect(originFromHost('students-demo-v2.ihubiitrcourses.org')).toBe('ihub')
    expect(originFromHost('IHUB.example.com')).toBe('ihub')
  })

  it('falls back to masai for everything else', () => {
    expect(originFromHost('students-demo-v2.masaischool.com')).toBe('masai')
    expect(originFromHost('localhost')).toBe('masai')
    expect(originFromHost(undefined)).toBe('masai')
    expect(originFromHost(null)).toBe('masai')
  })
})

describe('getAppOrigin', () => {
  it('derives the origin from the browser host at runtime', () => {
    // jsdom URL above is an ihub host.
    expect(getAppOrigin()).toBe('ihub')
  })
})

describe('withAppOriginHeader', () => {
  it('adds the X-App-Origin header for the runtime origin', () => {
    const headers = withAppOriginHeader({ 'Content-Type': 'application/json' })

    expect(headers.get('Content-Type')).toBe('application/json')
    expect(headers.get('X-App-Origin')).toBe('ihub')
  })
})
