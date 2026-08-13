import { describe, expect, it } from 'vitest'
import { isAllowedOrigin } from './start'

describe('isAllowedOrigin', () => {
  it('allows the old LMS origin of every portal', () => {
    expect(isAllowedOrigin('https://students.masaischool.com')).toBe(true)
    expect(isAllowedOrigin('https://courses.ihubiitrcourses.org')).toBe(true)
  })

  it('allows this app on every portal', () => {
    expect(isAllowedOrigin('https://learn.masaischool.com')).toBe(true)
    expect(isAllowedOrigin('https://learn.ihubiitrcourses.org')).toBe(true)
    expect(isAllowedOrigin('https://iitj-learn.masaischool.com')).toBe(true)
  })

  it('allows localhost on any port and scheme (dev)', () => {
    expect(isAllowedOrigin('http://localhost:3002')).toBe(true)
    expect(isAllowedOrigin('http://127.0.0.1:3002')).toBe(true)
  })

  it('rejects http and unknown domains', () => {
    expect(isAllowedOrigin('http://students.masaischool.com')).toBe(false)
    expect(isAllowedOrigin('https://evil.com')).toBe(false)
    // Suffix must be a full label boundary, not a substring match.
    expect(isAllowedOrigin('https://notmasaischool.com')).toBe(false)
    expect(isAllowedOrigin('https://ihubiitrcourses.org.evil.com')).toBe(false)
    expect(isAllowedOrigin('not a url')).toBe(false)
  })
})
