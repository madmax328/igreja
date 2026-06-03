import mongoose from 'mongoose'

let cached = (global as any).mongoose || { conn: null, promise: null }

export async function connectDB() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI environment variable is not set')

  if (cached.conn) return cached.conn
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri)
  }
  cached.conn = await cached.promise
  return cached.conn
}
