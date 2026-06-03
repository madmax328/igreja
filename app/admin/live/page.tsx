'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import DirectorView from '@/components/DirectorView'
import Link from 'next/link'

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
  const [ended, setEnded] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login')
  }, [status, router])

  useEffect(() => {
    fetch('/api/cultos')
      .then(r => r.json())
      .then(data => {
        setCultos(data.filter((c: Culto) => c.status === 'agendado' || c.status === 'ao_vivo'))
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  )

  if (ended) return (
    <AdminLayout>
      <div className="max-w-2xl card-dark text-center py-12">
        <p className="text-2xl text-gold-400 font-semibold mb-2">Live encerrada ✓</p>
        <p className="text-zinc-400 mb-6">A gravação está a ser processada.</p>
        <button onClick={() => { setEnded(false); setSelectedCulto(null) }} className="btn-gold px-8 py-3">
          Nova live
        </button>
      </div>
    </AdminLayout>
  )

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Director</h1>
          {selectedCulto && (
            <Link
              href="/admin/live/camera"
              className="text-sm text-zinc-400 hover:text-gold-400 border border-zinc-700 hover:border-gold-500 px-4 py-2 rounded-lg transition-colors"
            >
              📷 Abrir como Câmera
            </Link>
          )}
        </div>

        {!selectedCulto ? (
          <div>
            <p className="text-zinc-400 mb-2">Selecciona o culto:</p>
            <p className="text-zinc-600 text-sm mb-6">
              Depois partilha o link <strong className="text-zinc-400">/admin/live/camera</strong> com os operadores de câmera.
            </p>
            {cultos.length === 0 ? (
              <div className="card-dark text-center py-10 text-zinc-500">
                <p className="mb-4">Nenhum culto agendado.</p>
                <Link href="/admin/cultos" className="text-gold-400 hover:underline">Agendar um culto</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {cultos.map(culto => (
                  <button
                    key={culto._id}
                    onClick={() => setSelectedCulto(culto)}
                    className="w-full card-dark hover:border-gold-500/50 transition-colors text-left flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{culto.titulo}</p>
                      <p className="text-zinc-500 text-sm">
                        {new Date(culto.data).toLocaleDateString('pt-PT', {
                          weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className="text-gold-400 text-sm">Seleccionar →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <DirectorView
            cultoId={selectedCulto._id}
            cultoTitulo={selectedCulto.titulo}
            onEnd={() => setEnded(true)}
          />
        )}
      </div>
    </AdminLayout>
  )
}
