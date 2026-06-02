import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import Corte from '@/models/Corte'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  const body = await req.json()
  const corte = await Corte.findByIdAndUpdate(id, body, { new: true })
  return NextResponse.json(corte)
}
