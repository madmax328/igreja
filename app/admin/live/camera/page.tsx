'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import CameraOperator from '@/components/CameraOperator'

interface Culto {
  _id: string
  titulo: string
  data: string
  status: string
}

export default function CameraPage() {
  const { status } = useSession()
  const router = useRouter()
  const [cultos, setCultos] = useState<Culto[]>([])
  const [selected, setSelected] = useState<Culto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login')
  }, [status, router])

  useEffect(() => {
    fetch('/api/cultos')
      .then(r => r.json())
      .then(data => {
        const activos = data.filter((c: Culto) => c.status === 'agendado' || c.status === 'ao_vivo')
        // Se há só um culto ao vivo, seleccionar automaticamente
        const aoVivo = activos.find((c: Culto) => c.status === 'ao_vivo')
        if (aoVivo) setSelected(aoVivo)
        setCultos(activos)
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (selected) return (
    <CameraOperator cultoId={selected._id} cultoTitulo={selected.titulo} />
  )

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <p className="text-gold-400 font-bold text-xl mb-1 text-center">Operador de Câmera</p>
        <p className="text-zinc-500 text-sm text-center mb-8">Selecciona o culto</p>
        <div className="space-y-3">
          {cultos.map(c => (
            <button
              key={c._id}
              onClick={() => setSelected(c)}
              className="w-full bg-zinc-900 border border-zinc-800 hover:border-gold-500/50 rounded-xl p-4 text-left transition-colors"
            >
              <p className="font-medium text-white">{c.titulo}</p>
              <p className="text-zinc-500 text-sm mt-0.5">
                {new Date(c.data).toLocaleDateString('pt-PT', {
                  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </button>
          ))}
          {cultos.length === 0 && (
            <p className="text-zinc-600 text-center">Nenhum culto activo.</p>
          )}
        </div>
      </div>
    </div>
  )
}
