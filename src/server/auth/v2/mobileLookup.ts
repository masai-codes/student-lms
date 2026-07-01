/**
 * The sign-in client strips phone input down to a bare 10-digit national number
 * (see `detectIdentifier.parseIdentifier`) before it ever reaches the server.
 * But `users.mobile` is a free-form `varchar` and historically holds numbers in
 * several shapes: bare 10 digits (`9258459097`), E.164 (`+919258459097`),
 * `91`-prefixed, or `0`-prefixed. An exact `eq(users.mobile, input)` therefore
 * silently misses every account whose stored number carries a country code,
 * surfacing as a false "user doesn't exist".
 *
 * This returns the set of accepted variants for the given identifier so lookups
 * find the account regardless of how the number was stored.
 */
export function mobileLookupCandidates(identifier: string): Array<string> {
  const digits = identifier.replace(/\D/g, '')
  const last10 = digits.slice(-10)

  // Preserve the original input so nothing regresses, then add normalized forms.
  const variants = new Set<string>([identifier])
  if (last10.length === 10) {
    variants.add(last10)
    variants.add(`+91${last10}`)
    variants.add(`91${last10}`)
    variants.add(`0${last10}`)
  }
  return [...variants]
}
