import type { RoomConfiguration } from '@livekit/protocol'
import { AccessToken } from 'livekit-server-sdk'
import { CHATBOT_AGENT_NAME } from '@/server/api/chatbot/constants'
import type { ChatMode } from '@/server/api/chatbot/types'

function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`CHATBOT_${name}_NOT_CONFIGURED`)
  }
  return value
}

export async function createChatbotToken(params: {
  mode: ChatMode
  sessionId: string
}) {
  const apiKey = getRequiredEnv('LIVEKIT_API_KEY')
  const apiSecret = getRequiredEnv('LIVEKIT_API_SECRET')
  const serverUrl = getRequiredEnv('LIVEKIT_URL')

  const roomName = `chat-${crypto.randomUUID()}`
  const participantName = `user-${crypto.randomUUID().slice(0, 8)}`

  const accessToken = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
    ttl: '1h',
  })

  accessToken.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  })

  accessToken.roomConfig = {
    agents: [
      {
        agentName: CHATBOT_AGENT_NAME,
        metadata: JSON.stringify({
          mode: params.mode,
          participant_identity: participantName,
          session_id: params.sessionId,
        }),
      },
    ],
  } as RoomConfiguration

  const participantToken = await accessToken.toJwt()

  return {
    serverUrl,
    roomName,
    participantName,
    participantToken,
    sessionId: params.sessionId,
  }
}

