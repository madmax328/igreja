import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import Culto from '@/models/Culto'

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { cultoId } = await req.json()
  await connectDB()

  await Culto.findByIdAndUpdate(cultoId, { status: 'gravado' })

  // Background processing triggered via webhook from LiveKit Egress
  return NextResponse.json({ success: true, message: 'Live encerrada. A gravação será processada automaticamente.' })
}
