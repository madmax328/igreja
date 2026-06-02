'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'

interface Corte {
  _id: string
  titulo: string
  descricao: string
  timestamp_inicio: number
  timestamp_fim: number
  url_clip?: string
  youtube_id?: string
  status: 'pendente' | 'publicado' | 'rejeitado'
  culto_id: { titulo?: string } | string
}

function formatTime(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`
}

export default function AdminCortesPage() {
  const { status } = useSession()
  const router = useRouter()
  const [cortes, setCortes] = useState<Corte[]>([])
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [editando, setEditando] = useState<{ id: string; titulo: string; descricao: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login')
  }, [status, router])

  useEffect(() => {
    fetch('/api/cortes')
      .then(r => r.json())
      .then(data => { setCortes(data); setLoading(false) })
  }, [])

  async function handlePublicar(corte: Corte) {
    setEditando({ id: corte._id, titulo: corte.titulo, descricao: corte.descricao })
  }

  async function confirmPublicar() {
    if (!editando) return
    setPublishing(editando.id)
    const res = await fetch('/api/cortes/publicar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ corteId: editando.id, titulo: editando.titulo, descricao: editando.descricao }),
    })
    const data = await res.json()
    setCortes(prev => prev.map(c => c._id === editando.id ? { ...c, status: 'publicado', youtube_id: data.youtubeId } : c))
    setEditando(null)
    setPublishing(null)
  }

  async function handleRejeitar(id: string) {
    await fetch(`/api/cortes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejeitado' }),
    })
    setCortes(prev => prev.map(c => c._id === id ? { ...c, status: 'rejeitado' } : c))
  }

  const statusColors: Record<string, string> = {
    pendente: 'bg-amber-500/10 text-amber-400',
    publicado: 'bg-green-500/10 text-green-400',
    rejeitado: 'bg-zinc-700 text-zinc-500',
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold mb-8">Cortes</h1>

        {editando && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card-dark w-full max-w-lg">
              <h2 className="font-semibold text-lg mb-4">Publicar no YouTube</h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Título</label>
                  <input
                    type="text"
                    value={editando.titulo}
                    onChange={e => setEditando(ed => ed ? { ...ed, titulo: e.target.value } : null)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Descrição</label>
                  <textarea
                    value={editando.descricao}
                    onChange={e => setEditando(ed => ed ? { ...ed, descricao: e.target.value } : null)}
                    rows={3}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={confirmPublicar} disabled={!!publishing} className="btn-gold flex-1">
                  {publishing ? 'A publicar...' : 'Publicar'}
                </button>
                <button onClick={() => setEditando(null)} className="flex-1 border border-zinc-700 rounded-lg py-2 text-zinc-400 hover:text-white transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {cortes.map(corte => (
              <div key={corte._id} className="card-dark">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[corte.status]}`}>
                        {corte.status}
                      </span>
                      {typeof corte.culto_id === 'object' && corte.culto_id?.titulo && (
                        <span className="text-zinc-500 text-xs">{corte.culto_id.titulo}</span>
                      )}
                    </div>
                    <h3 className="font-medium">{corte.titulo}</h3>
                    {corte.descricao && (
                      <p className="text-zinc-500 text-sm mt-1">{corte.descricao}</p>
                    )}
                    <p className="text-zinc-600 text-xs mt-2">
                      {formatTime(corte.timestamp_inicio)} — {formatTime(corte.timestamp_fim)}
                      {' '}({corte.timestamp_fim - corte.timestamp_inicio}s)
                    </p>
                    {corte.youtube_id && (
                      <a
                        href={`https://youtube.com/watch?v=${corte.youtube_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 text-xs hover:underline mt-1 block"
                      >
                        Ver no YouTube →
                      </a>
                    )}
                  </div>
                </div>

                {corte.status === 'pendente' && (
                  <div className="flex gap-2 pt-3 border-t border-zinc-800">
                    <button
                      onClick={() => handlePublicar(corte)}
                      className="btn-gold text-sm py-1.5 px-4"
                    >
                      Publicar no YouTube
                    </button>
                    <button
                      onClick={() => handleRejeitar(corte._id)}
                      className="text-sm px-4 py-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      Rejeitar
                    </button>
                  </div>
                )}
              </div>
            ))}
            {cortes.length === 0 && (
              <div className="text-center py-16 text-zinc-500">
                <p>Nenhum corte gerado ainda.</p>
                <p className="text-sm mt-1">Os cortes são gerados automaticamente após cada culto.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
