/**
 * Same-origin calls to `/(auth)/v2/*` route handlers so `Set-Cookie` from the server
 * is stored by the browser. (JSON `createServerFn` responses do not forward Set-Cookie.)
 */

import { resolveTrueStatus } from '@/lib/api/cloudFrontSafeStatus'

type AuthenticatedUser = {
  id: number
  name: string
  email: string
  mobile: string | null
  role: string | null
}

export class V2AuthRequestError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'V2AuthRequestError'
  }
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) return undefined
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

function getErrorMessage(body: unknown): string | null {
  const error = getErrorObject(body)
  return typeof error?.message === 'string' ? error.message : null
}

function getErrorCode(body: unknown): string | null {
  const error = getErrorObject(body)
  return typeof error?.code === 'string' ? error.code : null
}

function getErrorObject(body: unknown): Record<string, unknown> | null {
  if (
    body &&
    typeof body === 'object' &&
    'error' in body &&
    body.error &&
    typeof body.error === 'object'
  ) {
    return body.error as Record<string, unknown>
  }
  return null
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const parsed = await readJson(res)
  if (!res.ok) {
    const code = getErrorCode(parsed) ?? 'REQUEST_FAILED'
    const message =
      getErrorMessage(parsed) ?? (res.statusText || 'Request failed')
    throw new V2AuthRequestError(resolveTrueStatus(res), code, message)
  }
  return parsed as T
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, {
    method: 'GET',
    credentials: 'include',
  })
  const parsed = await readJson(res)
  if (!res.ok) {
    const code = getErrorCode(parsed) ?? 'REQUEST_FAILED'
    const message =
      getErrorMessage(parsed) ?? (res.statusText || 'Request failed')
    throw new V2AuthRequestError(resolveTrueStatus(res), code, message)
  }
  return parsed as T
}

export type PasswordLoginResult = {
  user: AuthenticatedUser
  token: string
}

export async function v2LoginWithPassword(input: {
  email: string
  password: string
  rememberMe?: boolean
}): Promise<PasswordLoginResult> {
  return postJson<PasswordLoginResult>('/v2/login/', {
    email: input.email,
    password: input.password,
    rememberMe: input.rememberMe === true,
  })
}

export type RequestOtpResult = {
  channel: 'email' | 'sms' | 'whatsapp'
  otpSessionId: string
}

export async function v2RequestOtp(input: {
  identifier: string
  isResend: boolean
}): Promise<RequestOtpResult> {
  return postJson<RequestOtpResult>('/v2/login/request-otp', {
    identifier: input.identifier,
    isResend: input.isResend,
  })
}

export type VerifyOtpResult = {
  user: AuthenticatedUser
  token: string
}

export type LinkedAccount = {
  user: AuthenticatedUser
  sessionId: string
  isActive: boolean
}

export async function v2VerifyOtp(input: {
  otpSessionId: string
  otp: string
  rememberMe?: boolean
}): Promise<VerifyOtpResult> {
  return postJson<VerifyOtpResult>('/v2/login/verify-otp', {
    otpSessionId: input.otpSessionId,
    otp: input.otp,
    rememberMe: input.rememberMe === true,
  })
}

export async function v2FetchLinkedAccounts(): Promise<{
  accounts: Array<LinkedAccount>
}> {
  return getJson<{ accounts: Array<LinkedAccount> }>('/v2/auth/linked-accounts')
}

export type UseAccountResult = {
  user: AuthenticatedUser
  token: string
}

export async function v2UseAccount(input: {
  sessionId: string
  rememberMe?: boolean
}): Promise<UseAccountResult> {
  return postJson<UseAccountResult>('/v2/auth/use-account', {
    sessionId: input.sessionId,
    rememberMe: input.rememberMe === true,
  })
}

export async function v2ForgotPassword(input: {
  email: string
}): Promise<void> {
  await postJson<{ success: boolean; message?: string }>(
    '/v2/forgot-password',
    {
      email: input.email,
    },
  )
}

export async function v2ResetPassword(input: {
  token: string
  password: string
}): Promise<void> {
  await postJson<{ success: boolean }>('/v2/reset-password', {
    token: input.token,
    password: input.password,
  })
}
