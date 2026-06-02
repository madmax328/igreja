'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'

interface Culto {
  _id: string
  titulo: string
  data: string
  status: string
  descricao?: string
}

export default function AdminCultosPage() {
  const { status } = useSession()
  const router = useRouter()
  const [cultos, setCultos] = useState<Culto[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ titulo: '', data: '', descricao: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin/login')
  }, [status, router])

  useEffect(() => {
    fetch('/api/cultos')
      .then(r => r.json())
      .then(data => { setCultos(data); setLoading(false) })
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/cultos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const novo = await res.json()
    setCultos(prev => [novo, ...prev])
    setShowForm(false)
    setForm({ titulo: '', data: '', descricao: '' })
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Tens a certeza?')) return
    await fetch(`/api/cultos/${id}`, { method: 'DELETE' })
    setCultos(prev => prev.filter(c => c._id !== id))
  }

  const statusColors: Record<string, string> = {
    agendado: 'text-blue-400',
    ao_vivo: 'text-red-400',
    gravado: 'text-zinc-400',
    publicado: 'text-green-400',
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Cultos</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-gold">
            {showForm ? 'Cancelar' : '+ Agendar Culto'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="card-dark mb-8 space-y-4">
            <h2 className="font-semibold text-lg">Novo Culto</h2>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Título</label>
              <input
                type="text"
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Data e Hora</label>
              <input
                type="datetime-local"
                value={form.data}
                onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Descrição</label>
              <textarea
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                rows={3}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:border-amber-500 focus:outline-none resize-none"
              />
            </div>
            <button type="submit" disabled={saving} className="btn-gold">
              {saving ? 'A guardar...' : 'Guardar'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {cultos.map(culto => (
              <div key={culto._id} className="card-dark flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="font-medium truncate">{culto.titulo}</p>
                    <span className={`text-xs font-medium ${statusColors[culto.status] || ''}`}>
                      {culto.status}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-sm">
                    {new Date(culto.data).toLocaleDateString('pt-PT', {
                      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(culto._id)}
                  className="text-zinc-600 hover:text-red-400 transition-colors text-sm px-3 py-1"
                >
                  Eliminar
                </button>
              </div>
            ))}
            {cultos.length === 0 && (
              <div className="text-center py-16 text-zinc-500">Nenhum culto criado ainda.</div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
