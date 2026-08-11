# Masai Live login (admissions SSO bridge)

## Scope

Port of experience-api `GET|POST /user-auth/masai-live-login` into this app:

- Route: `src/routes/api/user-auth/masai-live-login.ts`
- Handlers: `src/server/api/user-auth/handlers/masaiLiveLogin.handler.ts`
- Service: `src/server/api/user-auth/services/resolveMasaiLiveConnectSid.service.ts`
- Cookie helpers: `src/server/api/user-auth/services/masaiLiveLoginCookies.ts`

## Behavior

1. Look up the user's most recent non-deleted `batch_user.enrolment_id`.
2. Mint a short-lived admissions JWT (`student_code`, `email`, `enrolment_id`).
3. `POST {ADMISSIONS_API_BASE_URL}/auth/lms-auto-login` and read `connect.sid`
   from the response `Set-Cookie`.
4. **POST** returns `{ success, data: { connectSid } }` for app clients.
5. **GET** sets `connect.sid` on the shared Masai cookie domain and 302s to the
   `redirect` query (default `https://masai-live.masaischool.com`). Missing
   enrolment still redirects to Masai Live (guest experience); other failures
   bounce to `FRONTEND_URL` or `/`.

The dashboard Masai Live promo CTA points at this GET endpoint so banner clicks
SSO before landing on Masai Live.

## Env

- `ADMISSIONS_SSO_SECRET` (required)
- `ADMISSIONS_API_BASE_URL` (required)
- `FRONTEND_URL` (optional; GET failure redirect home)

## Non-prod docs

Browse all APIs (incl. this one) at `GET /api/docs` when `NODE_ENV` is not
`production`. See `docs/testing/features/api-docs.md`.

## Commands

```bash
npm run test -- src/server/api/user-auth
```
