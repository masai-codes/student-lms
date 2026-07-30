import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
  dbSelect: vi.fn(),
  generateText: vi.fn(),
  getAiTutorChatModel: vi.fn(),
  ensureUserCanAccessLearnHubEntity: vi.fn(),
}))

vi.mock('@/db', () => ({ db: { select: hoisted.dbSelect } }))
vi.mock('ai', () => ({
  generateText: hoisted.generateText,
}))
vi.mock('@/server/api/ai-tutor/clients/anthropicModel', () => ({
  getAiTutorChatModel: hoisted.getAiTutorChatModel,
}))
vi.mock('@/server/learn/utils/ensureLearnEntityAccess', () => ({
  ensureUserCanAccessLearnHubEntity: hoisted.ensureUserCanAccessLearnHubEntity,
}))

function mockSelectChain(rows: unknown[]) {
  hoisted.dbSelect.mockReturnValueOnce({
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve(rows),
      }),
    }),
  })
}

describe('generateTicketTitle.service', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv, ANTHROPIC_API_KEY: 'test-key' }
    delete process.env.SUPPORT_AI_TITLES
    delete process.env.SUPPORT_AI_TITLE_TIMEOUT_MS
    hoisted.getAiTutorChatModel.mockReturnValue('mock-model')
    hoisted.ensureUserCanAccessLearnHubEntity.mockResolvedValue(true)
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('humanizeTicketSlug', () => {
    it('replaces hyphens and underscores with spaces', async () => {
      const { humanizeTicketSlug } =
        await import('../generateTicketTitle.service')
      expect(humanizeTicketSlug('score-issue')).toBe('score issue')
      expect(humanizeTicketSlug('general_query')).toBe('general query')
    })
  })

  describe('titleFromCategorySubcategory', () => {
    it('joins category and subcategory with an en dash', async () => {
      const { titleFromCategorySubcategory } =
        await import('../generateTicketTitle.service')
      expect(titleFromCategorySubcategory('lecture', 'Others')).toBe(
        'lecture – Others',
      )
    })

    it('returns only the category when subcategory is missing', async () => {
      const { titleFromCategorySubcategory } =
        await import('../generateTicketTitle.service')
      expect(titleFromCategorySubcategory('lecture', null)).toBe('lecture')
    })
  })

  describe('titleFromMessage', () => {
    it('uses the first non-empty line and caps length', async () => {
      const { titleFromMessage } =
        await import('../generateTicketTitle.service')
      expect(
        titleFromMessage(
          'Can you please share the html and colab files for this session.\nMore details here.',
        ),
      ).toBe('Can you please share the html and colab files for this session.')
    })

    it('strips HTML before extracting the line', async () => {
      const { titleFromMessage } =
        await import('../generateTicketTitle.service')
      expect(titleFromMessage('<p>Need help with <b>Colab</b></p>')).toBe(
        'Need help with Colab',
      )
    })

    it('returns empty string for blank messages', async () => {
      const { titleFromMessage } =
        await import('../generateTicketTitle.service')
      expect(titleFromMessage('   ')).toBe('')
    })
  })

  describe('sanitizeAndValidateAiTitle', () => {
    it('accepts a valid title and strips wrapping quotes', async () => {
      const { sanitizeAndValidateAiTitle } =
        await import('../generateTicketTitle.service')
      expect(
        sanitizeAndValidateAiTitle(
          '"Request for HTML and Colab Files for Current Session"',
        ),
      ).toBe('Request for HTML and Colab Files for Current Session')
    })

    it('rejects junk and overlong titles', async () => {
      const { sanitizeAndValidateAiTitle } =
        await import('../generateTicketTitle.service')
      expect(sanitizeAndValidateAiTitle('NA')).toBeNull()
      expect(sanitizeAndValidateAiTitle('Help')).toBeNull()
      expect(sanitizeAndValidateAiTitle('a'.repeat(81))).toBeNull()
      expect(
        sanitizeAndValidateAiTitle(
          'one two three four five six seven eight nine ten eleven twelve thirteen',
        ),
      ).toBeNull()
    })
  })

  describe('resolveTicketTitle', () => {
    it('uses the AI title when Anthropic returns a valid summary', async () => {
      hoisted.generateText.mockResolvedValue({
        text: 'Request for HTML and Colab Files for Current Session',
      })

      const { resolveTicketTitle } =
        await import('../generateTicketTitle.service')
      const result = await resolveTicketTitle({
        message:
          'Can you please share the html and colab files for this session.',
        category: 'lecture',
        subCategory: 'Others',
      })

      expect(result).toEqual({
        title: 'Request for HTML and Colab Files for Current Session',
        source: 'ai',
      })
      expect(hoisted.generateText).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'mock-model',
          temperature: 0.3,
        }),
      )
    })

    it('falls back to entity + subcategory when AI is disabled', async () => {
      process.env.SUPPORT_AI_TITLES = 'false'

      const { resolveTicketTitle } =
        await import('../generateTicketTitle.service')
      const result = await resolveTicketTitle({
        message: 'Need the files please',
        category: 'lecture',
        subCategory: 'Others',
        entityTitle: 'Module 3 Session 5',
      })

      expect(result).toEqual({
        title: 'Module 3 Session 5 – Others',
        source: 'entity',
      })
      expect(hoisted.generateText).not.toHaveBeenCalled()
    })

    it('falls back to the message line when AI fails and no entity is present', async () => {
      hoisted.generateText.mockRejectedValue(
        new Error('Anthropic request failed'),
      )

      const { resolveTicketTitle } =
        await import('../generateTicketTitle.service')
      const result = await resolveTicketTitle({
        message:
          'Can you please share the html and colab files for this session.',
        category: 'others',
        subCategory: null,
      })

      expect(result.source).toBe('message')
      expect(result.title).toContain('html and colab files')
    })

    it('falls back to category + subcategory when message is empty', async () => {
      process.env.SUPPORT_AI_TITLES = 'false'

      const { resolveTicketTitle } =
        await import('../generateTicketTitle.service')
      const result = await resolveTicketTitle({
        message: '   ',
        category: 'lecture',
        subCategory: 'Others',
      })

      expect(result).toEqual({
        title: 'lecture – Others',
        source: 'category',
      })
    })

    it('returns the hard default when everything else is blank', async () => {
      process.env.SUPPORT_AI_TITLES = 'false'

      const { resolveTicketTitle } =
        await import('../generateTicketTitle.service')
      const result = await resolveTicketTitle({
        message: '   ',
        category: '   ',
        subCategory: null,
      })

      expect(result).toEqual({ title: 'Support request', source: 'default' })
    })

    it('skips AI when ANTHROPIC_API_KEY is missing', async () => {
      delete process.env.ANTHROPIC_API_KEY

      const { resolveTicketTitle } =
        await import('../generateTicketTitle.service')
      const result = await resolveTicketTitle({
        message: '   ',
        category: 'lecture',
        subCategory: 'score-issue',
      })

      expect(result).toEqual({
        title: 'lecture – score issue',
        source: 'category',
      })
    })
  })

  describe('fetchEntityTitleForTicket', () => {
    it('returns a lecture title when the student can access the section', async () => {
      mockSelectChain([{ title: 'Intro to Python', sectionId: 9 }])

      const { fetchEntityTitleForTicket } =
        await import('../fetchEntityTitleForTicket.service')
      const title = await fetchEntityTitleForTicket({
        userId: 1,
        category: 'lecture',
        entityId: 156168,
      })

      expect(title).toBe('Intro to Python')
      expect(hoisted.ensureUserCanAccessLearnHubEntity).toHaveBeenCalledWith(
        1,
        9,
      )
    })

    it('returns null when the student cannot access the entity section', async () => {
      mockSelectChain([{ title: 'Hidden Lecture', sectionId: 9 }])
      hoisted.ensureUserCanAccessLearnHubEntity.mockResolvedValue(false)

      const { fetchEntityTitleForTicket } =
        await import('../fetchEntityTitleForTicket.service')
      const title = await fetchEntityTitleForTicket({
        userId: 1,
        category: 'lecture',
        entityId: 99,
      })

      expect(title).toBeNull()
    })

    it('returns null for unsupported categories', async () => {
      const { fetchEntityTitleForTicket } =
        await import('../fetchEntityTitleForTicket.service')
      const title = await fetchEntityTitleForTicket({
        userId: 1,
        category: 'general_query',
        entityId: 1,
      })

      expect(title).toBeNull()
      expect(hoisted.dbSelect).not.toHaveBeenCalled()
    })
  })
})
