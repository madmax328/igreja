import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import Corte from '@/models/Corte'

export async function GET(req: NextRequest) {
  await connectDB()
  const { searchParams } = new URL(req.url)
  const cultoId = searchParams.get('cultoId')
  const query = cultoId ? { culto_id: cultoId } : {}
  const cortes = await Corte.find(query).populate('culto_id').sort({ createdAt: -1 })
  return NextResponse.json(cortes)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  const body = await req.json()
  const corte = await Corte.create(body)
  return NextResponse.json(corte, { status: 201 })
}
