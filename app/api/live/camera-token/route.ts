import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createCameraToken } from '@/lib/livekit'
import { connectDB } from '@/lib/mongodb'
import Culto from '@/models/Culto'

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { cultoId } = await req.json()
  await connectDB()

  const roomName = `culto-${cultoId}`
  // Identidade única por câmera para múltiplos dispositivos em simultâneo
  const cameraId = `camera-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const token = await createCameraToken(roomName, cameraId)

  await Culto.findByIdAndUpdate(cultoId, { status: 'ao_vivo', livekit_room: roomName })

  return NextResponse.json({ token, cameraId, roomName, livekitUrl: process.env.LIVEKIT_URL })
}
