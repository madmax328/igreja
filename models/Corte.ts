import mongoose, { Schema, Document } from 'mongoose'

export interface ICorte extends Document {
  culto_id: mongoose.Types.ObjectId
  titulo: string
  descricao: string
  timestamp_inicio: number
  timestamp_fim: number
  url_clip: string
  youtube_id: string
  status: 'pendente' | 'publicado' | 'rejeitado'
  createdAt: Date
}

const CorteSchema = new Schema<ICorte>({
  culto_id: { type: Schema.Types.ObjectId, ref: 'Culto', required: true },
  titulo: { type: String, required: true },
  descricao: String,
  timestamp_inicio: { type: Number, required: true },
  timestamp_fim: { type: Number, required: true },
  url_clip: String,
  youtube_id: String,
  status: { type: String, enum: ['pendente', 'publicado', 'rejeitado'], default: 'pendente' },
}, { timestamps: true })

export default mongoose.models.Corte || mongoose.model<ICorte>('Corte', CorteSchema)
