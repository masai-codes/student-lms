import { useEffect, useState } from 'react'

/**
 * Dev-only gate for the "Try New" switch. Students never see the CTA (it's
 * hidden and takes no space). To reveal it for testing — including on prod —
 * a developer enables it once, and it persists across reloads:
 *
 *   • Console:  localStorage.setItem('masai_try_new_cta', '1')  then reload
 *   • URL:      append `?tryNew=1` (or `?tryNew=0` to hide again)
 *
 * Returns false during SSR / first render to avoid hydration mismatch, then
 * reflects the stored flag after mount.
 */
const STORAGE_KEY = 'masai_try_new_cta'

export function useTryNewCtaVisible(): boolean {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const param = new URLSearchParams(window.location.search).get('tryNew')
      if (param === '1' || param === 'true') {
        localStorage.setItem(STORAGE_KEY, '1')
      } else if (param === '0' || param === 'false') {
        localStorage.removeItem(STORAGE_KEY)
      }
      setVisible(localStorage.getItem(STORAGE_KEY) === '1')
    } catch {
      setVisible(false)
    }
  }, [])

  // Enabled for all students. To revert to the dev-only gate, return `visible`.
  return true
}
