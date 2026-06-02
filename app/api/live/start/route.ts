import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createPublisherToken } from '@/lib/livekit'
import { connectDB } from '@/lib/mongodb'
import Culto from '@/models/Culto'

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { cultoId } = await req.json()
  await connectDB()

  const roomName = `culto-${cultoId}`
  const token = await createPublisherToken(roomName)

  await Culto.findByIdAndUpdate(cultoId, { status: 'ao_vivo', livekit_room: roomName })

  return NextResponse.json({ token, roomName, livekitUrl: process.env.LIVEKIT_URL })
}
