import mongoose, { Schema, Document } from 'mongoose'

export interface ICulto extends Document {
  titulo: string
  data: Date
  descricao: string
  status: 'agendado' | 'ao_vivo' | 'gravado' | 'publicado'
  livekit_room: string
  gravacao_url: string
  transcricao: string
  duracao: number
  espectadores_max: number
  createdAt: Date
  updatedAt: Date
}

const CultoSchema = new Schema<ICulto>({
  titulo: { type: String, required: true },
  data: { type: Date, required: true },
  descricao: String,
  status: { type: String, enum: ['agendado', 'ao_vivo', 'gravado', 'publicado'], default: 'agendado' },
  livekit_room: String,
  gravacao_url: String,
  transcricao: String,
  duracao: Number,
  espectadores_max: { type: Number, default: 0 },
}, { timestamps: true })

export default mongoose.models.Culto || mongoose.model<ICulto>('Culto', CultoSchema)
