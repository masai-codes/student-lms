# Sign-in (student LMS) Test Cases

## Scope

Client-only mock sign-in at `/signin`: email or phone identifier, password vs email OTP toggle, phone OTP where delivery channel is chosen by the backend (mock: random SMS vs WhatsApp per attempt; production-style status copy; submit still mock-only until API is wired).

## Test Files

- `src/components/features/sign-in/detectIdentifier.test.ts`
- `src/components/features/sign-in/signInReducer.test.ts`
- `src/components/features/sign-in/signInSubmit.test.ts`
- `src/components/features/sign-in/SignInFlow.test.tsx`

## How To Run

- Sign-in only: `npm run test -- src/components/features/sign-in`
- Full suite: `npm run test`

## Covered Test Cases

- `SIGNIN-001` - Module: `parseIdentifier` - Case: empty / whitespace rejected - Status: Covered
- `SIGNIN-002` - Module: `parseIdentifier` - Case: valid email normalized to lowercase - Status: Covered
- `SIGNIN-003` - Module: `parseIdentifier` - Case: `@` present but invalid pattern → `invalid_email` - Status: Covered
- `SIGNIN-004` - Module: `parseIdentifier` - Case: exactly 10-digit Indian mobile (spacing allowed; rejects country-code length) - Status: Covered
- `SIGNIN-005` - Module: `parseIdentifier` - Case: too few / too many digits rejected - Status: Covered
- `SIGNIN-006` - Module: `formatPhoneOtpHint` - Case: masks long numbers - Status: Covered
- `SIGNIN-007` - Module: `signInReducer` - Case: identifier → email / phone transitions and back - Status: Covered
- `SIGNIN-008` - Module: `signInReducer` - Case: email OTP / password mock toggles - Status: Covered
- `SIGNIN-009` - Module: `signInReducer` - Case: phone OTP field, resend mock, delivery from mock randomizer - Status: Covered
- `SIGNIN-010` - Module: `getSignInSubmitError` - Case: password / 6-digit OTP rules - Status: Covered
- `SIGNIN-011` - Module: `SignInFlow` - Case: email + password mock alert - Status: Covered
- `SIGNIN-012` - Module: `SignInFlow` - Case: email password ↔ OTP link swap - Status: Covered
- `SIGNIN-013` - Module: `SignInFlow` - Case: phone path shows OTP field - Status: Covered

## Pending / Next Cases

- `SIGNIN-014` - Wire to real auth APIs and replace `window.alert` mock - Status: Planned
- `SIGNIN-015` - E2E against staging (session cookies, redirects) - Status: Planned

## Maintenance Rules

- Keep reducer transitions covered when adding new steps or channels.
- Update this file and `feature-test-matrix.md` when sign-in behavior or tests change.
