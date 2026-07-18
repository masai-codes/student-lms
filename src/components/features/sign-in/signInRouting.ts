const REDIRECT_TO_KEY = 'redirectTo'

function getSearchValue(search?: string): string {
  if (typeof search === 'string') {
    return search
  }

  if (typeof window === 'undefined') {
    return ''
  }

  return window.location.search
}

export function getRedirectToSearchParam(search?: string): string | null {
  const redirectTo = new URLSearchParams(getSearchValue(search))
    .get(REDIRECT_TO_KEY)
    ?.trim()
  return redirectTo ? redirectTo : null
}

export function redirectToResolvedUrl(url: string): void {
  if (typeof window === 'undefined') {
    return
  }

  window.location.assign(url)
}

export function buildSwitchAccountUrl(redirectTo: string | null): string {
  const params = new URLSearchParams()
  if (redirectTo) {
    params.set(REDIRECT_TO_KEY, redirectTo)
  }

  const queryString = params.toString()
  return queryString ? `/switch-account?${queryString}` : '/switch-account'
}

export function redirectToSwitchAccountPage(redirectTo: string | null): void {
  redirectToResolvedUrl(buildSwitchAccountUrl(redirectTo))
}

const ADD_ACCOUNT_INTENT_KEY = 'intent'
const ADD_ACCOUNT_INTENT_VALUE = 'add-account'

/** `/signin?intent=add-account` — lets an already-authenticated browser reach the sign-in form to link a second account instead of being bounced home. */
export function buildAddAccountSignInUrl(): string {
  return `/signin?${ADD_ACCOUNT_INTENT_KEY}=${ADD_ACCOUNT_INTENT_VALUE}`
}

export function isAddAccountIntent(search?: string): boolean {
  return (
    new URLSearchParams(getSearchValue(search)).get(ADD_ACCOUNT_INTENT_KEY) ===
    ADD_ACCOUNT_INTENT_VALUE
  )
}
