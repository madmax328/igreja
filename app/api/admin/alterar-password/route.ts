import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { passwordAtual, passwordNova } = await req.json()

  if (!passwordAtual || !passwordNova) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  await connectDB()
  const user = await User.findOne({ email: session.user.email })
  if (!user) {
    return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 })
  }

  const valida = await bcrypt.compare(passwordAtual, user.password)
  if (!valida) {
    return NextResponse.json({ error: 'Password actual incorrecta' }, { status: 400 })
  }

  user.password = await bcrypt.hash(passwordNova, 10)
  await user.save()

  return NextResponse.json({ success: true })
}
