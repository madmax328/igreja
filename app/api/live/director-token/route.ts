import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createDirectorToken } from '@/lib/livekit'
import { connectDB } from '@/lib/mongodb'
import Culto from '@/models/Culto'

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { cultoId } = await req.json()
  await connectDB()

  const culto = await Culto.findById(cultoId)
  if (!culto) return NextResponse.json({ error: 'Culto não encontrado' }, { status: 404 })

  const roomName = culto.livekit_room || `culto-${cultoId}`
  const token = await createDirectorToken(roomName)

  return NextResponse.json({ token, roomName, livekitUrl: process.env.LIVEKIT_URL })
}
