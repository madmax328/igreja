export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { connectDB } from '@/lib/mongodb'
import Culto from '@/models/Culto'
import Corte from '@/models/Corte'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'

async function getStats() {
  await connectDB()
  const [total, aoVivo, agendados, cortesPendentes] = await Promise.all([
    Culto.countDocuments(),
    Culto.countDocuments({ status: 'ao_vivo' }),
    Culto.countDocuments({ status: 'agendado' }),
    Corte.countDocuments({ status: 'pendente' }),
  ])
  const proximos = await Culto.find({ status: 'agendado', data: { $gte: new Date() } })
    .sort({ data: 1 }).limit(3).lean()
  return { total, aoVivo, agendados, cortesPendentes, proximos }
}

export default async function AdminPage() {
  const session = await getServerSession()
  if (!session) redirect('/admin/login')

  const stats = await getStats()

  const statCards = [
    { label: 'Total de Cultos', value: stats.total, color: 'text-white' },
    { label: 'Ao Vivo', value: stats.aoVivo, color: 'text-red-400' },
    { label: 'Agendados', value: stats.agendados, color: 'text-blue-400' },
    { label: 'Cortes Pendentes', value: stats.cortesPendentes, color: 'text-amber-400' },
  ]

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {statCards.map(card => (
            <div key={card.label} className="card-dark text-center">
              <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-zinc-500 text-sm mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Link href="/admin/live" className="card-dark hover:border-amber-500/50 transition-colors group block">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-2xl">⬤</div>
              <div>
                <h3 className="font-semibold group-hover:text-amber-400 transition-colors">Iniciar Live</h3>
                <p className="text-zinc-500 text-sm">Transmitir um culto ao vivo</p>
              </div>
            </div>
          </Link>
          <Link href="/admin/cortes" className="card-dark hover:border-amber-500/50 transition-colors group block">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-2xl">✂</div>
              <div>
                <h3 className="font-semibold group-hover:text-amber-400 transition-colors">Gerir Cortes</h3>
                <p className="text-zinc-500 text-sm">{stats.cortesPendentes} cortes pendentes</p>
              </div>
            </div>
          </Link>
        </div>

        {stats.proximos.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Próximos Cultos</h2>
              <Link href="/admin/cultos" className="text-amber-400 text-sm hover:underline">Gerir todos</Link>
            </div>
            <div className="space-y-3">
              {stats.proximos.map(culto => (
                <div key={(culto as any)._id.toString()} className="card-dark flex items-center justify-between">
                  <div>
                    <p className="font-medium">{(culto as any).titulo}</p>
                    <p className="text-zinc-500 text-sm">
                      {new Date((culto as any).data).toLocaleDateString('pt-PT', {
                        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <Link href="/admin/live" className="btn-gold text-sm py-1.5 px-4">
                    Transmitir
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
