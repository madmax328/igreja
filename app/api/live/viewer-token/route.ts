import { NextRequest, NextResponse } from 'next/server'
import { createViewerToken } from '@/lib/livekit'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const roomName = searchParams.get('room')

  if (!roomName) return NextResponse.json({ error: 'Room required' }, { status: 400 })

  const participantName = `viewer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const token = await createViewerToken(roomName, participantName)

  return NextResponse.json({ token, livekitUrl: process.env.LIVEKIT_URL })
}
