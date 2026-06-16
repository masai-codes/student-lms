/**
 * Support handlers — ticket reads + mutations.
 *
 *   GET  /api/support/tickets          → {@link handleListTickets}
 *   GET  /api/support/tickets/thread   → {@link handleGetTicketThread}
 *   POST /api/support/tickets/create   → {@link handleCreateTicket}
 *   POST /api/support/tickets/reply    → {@link handleAddReply}
 *   POST /api/support/tickets/rate     → {@link handleRateTicket}
 *   POST /api/support/tickets/reopen   → {@link handleReopenTicket}
 *   POST /api/support/tickets/escalate → {@link handleEscalateTicket}
 *
 * Every handler resolves the session user; mutations enforce ownership +
 * capabilities inside the service layer.
 */

import { z } from 'zod'
import { jsonOk } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import {
  getTicketThread,
  listTickets,
} from '@/server/api/support/services/tickets.read.service'
import {
  addReply,
  createTicket,
  escalateTicket,
  rateTicket,
  reopenTicket,
} from '@/server/api/support/services/tickets.write.service'
import {
  mapSupportError,
  optionalIntParam,
  readJsonBody,
  requireIntParam,
} from '@/server/api/support/http'

/** GET /api/support/tickets?tab=&page= */
export async function handleListTickets(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const url = new URL(request.url)
    const tabRaw = url.searchParams.get('tab')
    const tab =
      tabRaw === 'resolved' || tabRaw === 'all' ? tabRaw : 'unresolved'
    const tickets = await listTickets({
      userId,
      tab,
      page: optionalIntParam(url, 'page'),
    })
    return jsonOk({ tickets })
  } catch (error) {
    return mapSupportError(error)
  }
}

/** GET /api/support/tickets/thread?ticketId= */
export async function handleGetTicketThread(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const ticketId = requireIntParam(
      new URL(request.url),
      'ticketId',
      'SUPPORT_TICKET_NOT_FOUND',
    )
    const thread = await getTicketThread({ userId, ticketId })
    return jsonOk(thread)
  } catch (error) {
    return mapSupportError(error)
  }
}

const createSchema = z.object({
  batchId: z.number().int().positive(),
  category: z.string().min(1),
  subCategory: z.string().nullish(),
  message: z.string().min(1),
  questionId: z.number().int().positive().nullish(),
})

/** POST /api/support/tickets/create */
export async function handleCreateTicket(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const body = await readJsonBody(request, createSchema)
    const result = await createTicket({ userId, ...body })
    return jsonOk(result)
  } catch (error) {
    return mapSupportError(error)
  }
}

const replySchema = z.object({
  ticketId: z.number().int().positive(),
  message: z.string().min(1),
})

/** POST /api/support/tickets/reply */
export async function handleAddReply(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const body = await readJsonBody(request, replySchema)
    const result = await addReply({ userId, ...body })
    return jsonOk(result)
  } catch (error) {
    return mapSupportError(error)
  }
}

const rateSchema = z.object({
  ticketId: z.number().int().positive(),
  rating: z.union([z.literal(1), z.literal(5)]),
})

/** POST /api/support/tickets/rate */
export async function handleRateTicket(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const body = await readJsonBody(request, rateSchema)
    const result = await rateTicket({ userId, ...body })
    return jsonOk(result)
  } catch (error) {
    return mapSupportError(error)
  }
}

const ticketIdSchema = z.object({ ticketId: z.number().int().positive() })

/** POST /api/support/tickets/reopen */
export async function handleReopenTicket(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const body = await readJsonBody(request, ticketIdSchema)
    const result = await reopenTicket({ userId, ...body })
    return jsonOk(result)
  } catch (error) {
    return mapSupportError(error)
  }
}

/** POST /api/support/tickets/escalate */
export async function handleEscalateTicket(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const body = await readJsonBody(request, ticketIdSchema)
    const result = await escalateTicket({ userId, ...body })
    return jsonOk(result)
  } catch (error) {
    return mapSupportError(error)
  }
}
