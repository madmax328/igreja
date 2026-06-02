'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import BroadcastStudio from '@/components/BroadcastStudio'

interface Culto {
  _id: string
  titulo: string
  data: string
  status: string
}

export default function AdminLivePage() {
  const { status } = useSession()
  const router = useRouter()
  const [cultos, setCultos] = useState<Culto[]>([])
  const [selectedCulto, setSelectedCulto] = useState<Culto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login')
  }, [status, router])

  useEffect(() => {
    fetch('/api/cultos')
      .then(r => r.json())
      .then(data => {
        const agendados = data.filter((c: Culto) => c.status === 'agendado' || c.status === 'ao_vivo')
        setCultos(agendados)
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  )

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold mb-8">Estúdio de Transmissão</h1>

        {!selectedCulto ? (
          <div>
            <p className="text-zinc-400 mb-6">Selecciona o culto que queres transmitir:</p>
            {cultos.length === 0 ? (
              <div className="card-dark text-center py-10 text-zinc-500">
                <p className="mb-4">Nenhum culto agendado.</p>
                <a href="/admin/cultos" className="text-amber-400 hover:underline">Agendar um culto</a>
              </div>
            ) : (
              <div className="space-y-3">
                {cultos.map(culto => (
                  <button
                    key={culto._id}
                    onClick={() => setSelectedCulto(culto)}
                    className="w-full card-dark hover:border-amber-500/50 transition-colors text-left flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{culto.titulo}</p>
                      <p className="text-zinc-500 text-sm">
                        {new Date(culto.data).toLocaleDateString('pt-PT', {
                          weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className="text-amber-400 text-sm">Seleccionar →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <BroadcastStudio cultoId={selectedCulto._id} cultoTitulo={selectedCulto.titulo} />
        )}
      </div>
    </AdminLayout>
  )
}
