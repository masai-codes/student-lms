export const isMasaiverseApp = (search?: string) => {
  const isWindowApp =
    typeof window !== 'undefined' &&
    Boolean((window as Window & { isApp?: boolean }).isApp)

  if (isWindowApp) return true

  const queryString =
    search ??
    (typeof window !== 'undefined' ? window.location.search : undefined)

  if (!queryString) return false

  const isAppParam = new URLSearchParams(queryString).get('isApp')
  return isAppParam?.toLowerCase() === 'true'
}
