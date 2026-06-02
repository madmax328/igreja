import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/mongodb'
import Culto from '@/models/Culto'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await connectDB()
  const culto = await Culto.findById(id)
  if (!culto) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(culto)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  const body = await req.json()
  const culto = await Culto.findByIdAndUpdate(id, body, { new: true })
  return NextResponse.json(culto)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await connectDB()
  await Culto.findByIdAndDelete(id)
  return NextResponse.json({ success: true })
}
