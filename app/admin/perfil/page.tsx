'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'

export default function PerfilPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [form, setForm] = useState({ passwordAtual: '', passwordNova: '', confirmar: '' })
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  if (status === 'unauthenticated') {
    router.push('/admin/login')
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMensagem(null)

    if (form.passwordNova !== form.confirmar) {
      setMensagem({ tipo: 'erro', texto: 'As passwords novas não coincidem.' })
      return
    }

    if (form.passwordNova.length < 8) {
      setMensagem({ tipo: 'erro', texto: 'A password nova deve ter pelo menos 8 caracteres.' })
      return
    }

    setLoading(true)
    const res = await fetch('/api/admin/alterar-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passwordAtual: form.passwordAtual, passwordNova: form.passwordNova }),
    })
    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      setMensagem({ tipo: 'sucesso', texto: 'Password alterada com sucesso.' })
      setForm({ passwordAtual: '', passwordNova: '', confirmar: '' })
    } else {
      setMensagem({ tipo: 'erro', texto: data.error || 'Erro ao alterar password.' })
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-md">
        <h1 className="text-2xl font-bold mb-2">Perfil</h1>
        <p className="text-zinc-400 mb-8">{session?.user?.email}</p>

        <div className="card-dark">
          <h2 className="font-semibold text-lg mb-6">Alterar Password</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Password actual</label>
              <input
                type="password"
                value={form.passwordAtual}
                onChange={e => setForm(f => ({ ...f, passwordAtual: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:border-gold-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Password nova</label>
              <input
                type="password"
                value={form.passwordNova}
                onChange={e => setForm(f => ({ ...f, passwordNova: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:border-gold-500 focus:outline-none"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Confirmar password nova</label>
              <input
                type="password"
                value={form.confirmar}
                onChange={e => setForm(f => ({ ...f, confirmar: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:border-gold-500 focus:outline-none"
                required
                minLength={8}
              />
            </div>

            {mensagem && (
              <div className={`text-sm px-4 py-3 rounded-lg ${
                mensagem.tipo === 'sucesso'
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {mensagem.texto}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-gold w-full py-3 mt-2">
              {loading ? 'A guardar...' : 'Alterar Password'}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  )
}
