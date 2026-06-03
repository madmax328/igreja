import { AccessToken, RoomServiceClient } from 'livekit-server-sdk'

const apiKey = process.env.LIVEKIT_API_KEY!
const apiSecret = process.env.LIVEKIT_API_SECRET!
const livekitUrl = process.env.LIVEKIT_URL!

export function createViewerToken(roomName: string, participantName: string) {
  const at = new AccessToken(apiKey, apiSecret, { identity: participantName })
  at.addGrant({ roomJoin: true, room: roomName, canPublish: false, canSubscribe: true })
  return at.toJwt()
}

// Cada câmera tem identidade única para não desligar as outras
export function createCameraToken(roomName: string, cameraId: string) {
  const at = new AccessToken(apiKey, apiSecret, { identity: cameraId })
  at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: false, roomCreate: true })
  return at.toJwt()
}

// Director: vê tudo, envia sinais de controlo, não publica vídeo
export function createDirectorToken(roomName: string) {
  const at = new AccessToken(apiKey, apiSecret, { identity: 'director' })
  at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true, roomCreate: true })
  return at.toJwt()
}

export function getRoomService() {
  return new RoomServiceClient(livekitUrl, apiKey, apiSecret)
}
