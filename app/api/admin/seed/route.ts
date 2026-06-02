import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 })
  }
  await connectDB()
  const existing = await User.findOne({ email: 'admin@igreja.com' })
  if (existing) return NextResponse.json({ message: 'Admin already exists' })

  const password = await bcrypt.hash('admin123', 10)
  await User.create({ nome: 'Administrador', email: 'admin@igreja.com', password, role: 'admin' })

  return NextResponse.json({ message: 'Admin created: admin@igreja.com / admin123' })
}
