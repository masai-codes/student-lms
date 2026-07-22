import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { log, logger } from './logger'

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-02T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('writes compact JSON to console.log for info in production', () => {
    vi.stubEnv('NODE_ENV', 'production')

    logger.info({ msg: 'Points awarded', fn: 'awardManualPoints', userId: 42 })

    expect(console.log).toHaveBeenCalledOnce()
    expect(console.log).toHaveBeenCalledWith(
      JSON.stringify({
        level: 'info',
        time: '2026-07-02T10:00:00.000Z',
        msg: 'Points awarded',
        fn: 'awardManualPoints',
        userId: 42,
      }),
    )
  })

  it('pretty-prints JSON outside production', () => {
    vi.stubEnv('NODE_ENV', 'development')

    logger.debug({ msg: 'Cache hit', fn: 'getBanners' })

    expect(console.log).toHaveBeenCalledOnce()
    const output = vi.mocked(console.log).mock.calls[0]?.[0]
    expect(output).toContain('\n')
    expect(JSON.parse(output as string)).toMatchObject({
      level: 'debug',
      msg: 'Cache hit',
      fn: 'getBanners',
    })
  })

  it('routes warn and error to stderr helpers', () => {
    vi.stubEnv('NODE_ENV', 'production')

    logger.warn({ msg: 'Deprecated field used', fn: 'updateClub' })
    logger.error({ msg: 'Request failed', fn: 'createEvent' })

    expect(console.warn).toHaveBeenCalledOnce()
    expect(console.error).toHaveBeenCalledOnce()
    expect(console.log).not.toHaveBeenCalled()
  })

  it('serializes Error instances on the err field', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const err = new Error('DB timeout')

    log('error', { msg: 'Failed to save', fn: 'awardManualPoints', err })

    const output = vi.mocked(console.error).mock.calls[0]?.[0] as string
    const parsed = JSON.parse(output) as { err: { name: string; message: string } }
    expect(parsed.err).toEqual({
      name: 'Error',
      message: 'DB timeout',
      stack: err.stack,
    })
  })

  it('passes through non-Error err values unchanged', () => {
    vi.stubEnv('NODE_ENV', 'production')

    logger.error({ msg: 'Validation failed', err: { code: 'INVALID' } })

    const output = vi.mocked(console.error).mock.calls[0]?.[0] as string
    expect(JSON.parse(output).err).toEqual({ code: 'INVALID' })
  })

  it('omits err when not provided', () => {
    vi.stubEnv('NODE_ENV', 'production')

    logger.info({ msg: 'OK' })

    const output = vi.mocked(console.log).mock.calls[0]?.[0] as string
    expect(JSON.parse(output)).not.toHaveProperty('err')
  })
})
