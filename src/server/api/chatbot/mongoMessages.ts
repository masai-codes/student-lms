import { MongoClient, type Collection, type Db } from 'mongodb'
import type { MessageRole } from '@/server/api/chatbot/types'

type ChatbotMessageDoc = {
  _id: string
  sessionId: string
  lectureId: number
  userId: number
  role: MessageRole
  content: string
  sourceType: string
  livekitId: string | null
  createdAt: Date
}

let mongoClient: MongoClient | null = null
let mongoDb: Db | null = null

function getMongoUri(): string {
  const uri = process.env.CHATBOT_MONGODB_URI ?? process.env.MONGODB_URI
  if (!uri) {
    throw new Error('CHATBOT_MONGODB_URI_NOT_CONFIGURED')
  }
  return uri
}

function getMongoDbName(): string {
  return process.env.CHATBOT_MONGODB_DB_NAME ?? 'livekit_chat'
}

async function ensureMongoDb(): Promise<Db> {
  if (mongoDb) {
    return mongoDb
  }

  mongoClient = new MongoClient(getMongoUri())
  await mongoClient.connect()
  mongoDb = mongoClient.db(getMongoDbName())

  const messages = mongoDb.collection<ChatbotMessageDoc>('messages')
  await messages.createIndex({ sessionId: 1, createdAt: 1 })
  await messages.createIndex(
    { sessionId: 1, livekitId: 1 },
    { unique: true, partialFilterExpression: { livekitId: { $type: 'string' } } },
  )

  return mongoDb
}

async function messagesCollection(): Promise<Collection<ChatbotMessageDoc>> {
  const db = await ensureMongoDb()
  return db.collection<ChatbotMessageDoc>('messages')
}

export async function listChatbotMessagesBySession(sessionId: string) {
  const collection = await messagesCollection()
  const docs = await collection.find({ sessionId }).sort({ createdAt: 1 }).toArray()
  return docs.map((doc) => ({
    id: doc._id,
    role: doc.role,
    content: doc.content,
    sourceType: doc.sourceType,
    livekitId: doc.livekitId,
    createdAt: doc.createdAt.toISOString(),
  }))
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: number }).code === 11000
  )
}

export async function upsertChatbotMessage(params: {
  sessionId: string
  lectureId: number
  userId: number
  role: MessageRole
  content: string
  sourceType: string
  livekitId?: string | null
}) {
  const collection = await messagesCollection()
  const trimmed = params.content.trim()
  if (!trimmed) {
    return null
  }

  const now = new Date()
  const livekitId = params.livekitId ?? null

  if (livekitId) {
    const existing = await collection.findOne({ sessionId: params.sessionId, livekitId })
    if (existing) {
      if (existing.content === trimmed) {
        return {
          id: existing._id,
          role: existing.role,
          content: existing.content,
          sourceType: existing.sourceType,
          livekitId: existing.livekitId,
          createdAt: existing.createdAt.toISOString(),
        }
      }

      const updated = await collection.findOneAndUpdate(
        { sessionId: params.sessionId, livekitId },
        { $set: { content: trimmed } },
        { returnDocument: 'after' },
      )
      if (updated) {
        return {
          id: updated._id,
          role: updated.role,
          content: updated.content,
          sourceType: updated.sourceType,
          livekitId: updated.livekitId,
          createdAt: updated.createdAt.toISOString(),
        }
      }
    }
  }

  const messageId = crypto.randomUUID()
  const doc: ChatbotMessageDoc = {
    _id: messageId,
    sessionId: params.sessionId,
    lectureId: params.lectureId,
    userId: params.userId,
    role: params.role,
    content: trimmed,
    sourceType: params.sourceType,
    livekitId,
    createdAt: now,
  }

  try {
    await collection.insertOne(doc)
  } catch (error) {
    if (livekitId && isDuplicateKeyError(error)) {
      const updated = await collection.findOneAndUpdate(
        { sessionId: params.sessionId, livekitId },
        { $set: { content: trimmed } },
        { returnDocument: 'after' },
      )
      if (updated) {
        return {
          id: updated._id,
          role: updated.role,
          content: updated.content,
          sourceType: updated.sourceType,
          livekitId: updated.livekitId,
          createdAt: updated.createdAt.toISOString(),
        }
      }
    }
    throw error
  }

  return {
    id: doc._id,
    role: doc.role,
    content: doc.content,
    sourceType: doc.sourceType,
    livekitId: doc.livekitId,
    createdAt: doc.createdAt.toISOString(),
  }
}

