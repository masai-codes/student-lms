import { afterEach, describe, expect, it } from 'vitest'

import { isApiError } from '@/server/api/http/apiError'
import { verifyWebhookApiKey } from '@/server/api/webhooks/http/verifyWebhookApiKey'

const ENV_VAR = 'TEST_WEBHOOK_KEY'

function requestWithKey(key?: string): Request {
  const headers = new Headers()
  if (key !== undefined) headers.set('x-api-key', key)
  return new Request('http://localhost/api/webhooks/test', {
    method: 'POST',
    headers,
  })
}

function expectApiError(fn: () => void, status: number, code: string) {
  try {
    fn()
  } catch (error) {
    expect(isApiError(error)).toBe(true)
    if (isApiError(error)) {
      expect(error.status).toBe(status)
      expect(error.code).toBe(code)
    }
    return
  }
  throw new Error('expected verifyWebhookApiKey to throw')
}

afterEach(() => {
  delete process.env[ENV_VAR]
  delete process.env.WEBHOOKS_SKIP_AUTH
})

describe('verifyWebhookApiKey', () => {
  it('throws 503 WEBHOOK_NOT_ENABLED when the env secret is unset', () => {
    expectApiError(
      () => verifyWebhookApiKey(requestWithKey('anything'), ENV_VAR),
      503,
      'WEBHOOK_NOT_ENABLED',
    )
  })

  it('throws 401 WEBHOOK_UNAUTHORIZED when the header is missing', () => {
    process.env[ENV_VAR] = 'expected-secret'
    expectApiError(
      () => verifyWebhookApiKey(requestWithKey(), ENV_VAR),
      401,
      'WEBHOOK_UNAUTHORIZED',
    )
  })

  it('throws 401 WEBHOOK_UNAUTHORIZED when the key does not match', () => {
    process.env[ENV_VAR] = 'expected-secret'
    expectApiError(
      () => verifyWebhookApiKey(requestWithKey('wrong-secret'), ENV_VAR),
      401,
      'WEBHOOK_UNAUTHORIZED',
    )
  })

  it('passes when the key matches', () => {
    process.env[ENV_VAR] = 'expected-secret'
    expect(() =>
      verifyWebhookApiKey(requestWithKey('expected-secret'), ENV_VAR),
    ).not.toThrow()
  })

  it('trims surrounding whitespace before comparing', () => {
    process.env[ENV_VAR] = '  expected-secret  '
    expect(() =>
      verifyWebhookApiKey(requestWithKey('expected-secret'), ENV_VAR),
    ).not.toThrow()
  })

  it('bypasses the check entirely when WEBHOOKS_SKIP_AUTH=true', () => {
    process.env.WEBHOOKS_SKIP_AUTH = 'true'
    // No env secret and no header, yet it must not throw.
    expect(() => verifyWebhookApiKey(requestWithKey(), ENV_VAR)).not.toThrow()
  })
})
