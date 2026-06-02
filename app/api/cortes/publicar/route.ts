import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import Corte from '@/models/Corte'

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { corteId, titulo, descricao } = await req.json()
  await connectDB()

  // In production: download clip from R2, upload to YouTube
  // For now, simulate success
  const youtubeId = `yt-${Date.now()}`

  await Corte.findByIdAndUpdate(corteId, {
    titulo,
    descricao,
    status: 'publicado',
    youtube_id: youtubeId,
  })

  return NextResponse.json({ success: true, youtubeId })
}
