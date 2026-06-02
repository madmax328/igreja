import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import Culto from '@/models/Culto'

export async function GET() {
  await connectDB()
  const cultos = await Culto.find().sort({ data: -1 })
  return NextResponse.json(cultos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const body = await req.json()
  const culto = await Culto.create(body)
  return NextResponse.json(culto, { status: 201 })
}
