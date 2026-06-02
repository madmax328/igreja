import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  nome: string
  email: string
  password: string
  role: 'admin' | 'editor'
}

const UserSchema = new Schema<IUser>({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'editor'], default: 'admin' },
})

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
