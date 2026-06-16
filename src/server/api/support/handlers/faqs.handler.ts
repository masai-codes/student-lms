/**
 * Support handlers — FAQ search + helpfulness vote.
 *
 *   GET  /api/support/faqs       → {@link handleSearchFaqs}
 *   POST /api/support/faqs/vote  → {@link handleVoteFaq}
 */

import { z } from 'zod'
import { jsonOk } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { searchFaqs, voteFaq } from '@/server/api/support/services/faqs.service'
import {
  mapSupportError,
  optionalIntParam,
  readJsonBody,
  requireIntParam,
} from '@/server/api/support/http'

/** GET /api/support/faqs?batchId=&search=&category=&subCategory=&limit= */
export async function handleSearchFaqs(request: Request): Promise<Response> {
  try {
    await requireSessionUserId(request)
    const url = new URL(request.url)
    const batchId = requireIntParam(url, 'batchId', 'SUPPORT_BATCH_REQUIRED')
    const faqs = await searchFaqs({
      batchId,
      search: url.searchParams.get('search') ?? undefined,
      category: url.searchParams.get('category') ?? undefined,
      subCategory: url.searchParams.get('subCategory') ?? undefined,
      limit: optionalIntParam(url, 'limit'),
    })
    return jsonOk({ faqs })
  } catch (error) {
    return mapSupportError(error)
  }
}

const voteSchema = z.object({
  faqId: z.number().int().positive(),
  vote: z.enum(['upvote', 'downvote']),
})

/** POST /api/support/faqs/vote { faqId, vote } */
export async function handleVoteFaq(request: Request): Promise<Response> {
  try {
    await requireSessionUserId(request)
    const body = await readJsonBody(request, voteSchema)
    const result = await voteFaq(body)
    return jsonOk(result)
  } catch (error) {
    return mapSupportError(error)
  }
}
