import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Culto from '@/models/Culto'

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (body.event === 'egress_ended') {
    const roomName = body.egressInfo?.roomName
    if (!roomName) return NextResponse.json({ ok: true })

    await connectDB()
    const culto = await Culto.findOne({ livekit_room: roomName })
    if (!culto) return NextResponse.json({ ok: true })

    const gravacaoUrl = body.egressInfo?.fileResults?.[0]?.downloadUrl || ''
    await Culto.findByIdAndUpdate(culto._id, {
      status: 'gravado',
      gravacao_url: gravacaoUrl,
    })

    // In production: trigger transcription + AI cut suggestion job here
  }

  return NextResponse.json({ ok: true })
}
