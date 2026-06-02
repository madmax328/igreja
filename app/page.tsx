export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { connectDB } from '@/lib/mongodb'
import Culto from '@/models/Culto'
import CultoCard from '@/components/CultoCard'

async function getData() {
  await connectDB()
  const liveAtual = await Culto.findOne({ status: 'ao_vivo' }).lean()
  const proximoCulto = await Culto.findOne({ status: 'agendado', data: { $gte: new Date() } })
    .sort({ data: 1 }).lean()
  const cultosRecentes = await Culto.find({ status: { $in: ['gravado', 'publicado'] } })
    .sort({ data: -1 }).limit(3).lean()
  return { liveAtual, proximoCulto, cultosRecentes }
}

export default async function HomePage() {
  const { liveAtual, proximoCulto, cultosRecentes } = await getData()

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <span className="text-gold-400 font-bold text-xl">Igreja</span>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/live" className="text-zinc-400 hover:text-white transition-colors">Live</Link>
          <Link href="/arquivo" className="text-zinc-400 hover:text-white transition-colors">Arquivo</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-6 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
        <h1 className="text-5xl md:text-6xl font-bold mb-4">
          Bem-vindo à{' '}
          <span className="text-amber-400">Nossa Igreja</span>
        </h1>
        <p className="text-zinc-400 text-xl max-w-2xl mx-auto mb-8">
          Junte-se a nós para adoração, ensino e comunhão. Acompanhe os nossos cultos ao vivo ou reveja os anteriores.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {liveAtual ? (
            <Link href="/live" className="btn-gold text-lg px-8 py-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block" />
              Assistir ao Vivo Agora
            </Link>
          ) : (
            <Link href="/arquivo" className="btn-gold text-lg px-8 py-3">
              Ver Cultos
            </Link>
          )}
          <Link href="/arquivo" className="border border-zinc-700 hover:border-amber-500 text-zinc-300 px-8 py-3 rounded-lg text-lg transition-colors">
            Arquivo
          </Link>
        </div>
      </section>

      {/* Live Banner */}
      {liveAtual && (
        <section className="max-w-4xl mx-auto px-6 mb-12">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
              <div>
                <p className="font-semibold text-red-300">CULTO AO VIVO AGORA</p>
                <p className="text-zinc-400 text-sm">{(liveAtual as any).titulo}</p>
              </div>
            </div>
            <Link href="/live" className="btn-gold">Assistir</Link>
          </div>
        </section>
      )}

      {/* Próximo Culto */}
      {proximoCulto && (
        <section className="max-w-4xl mx-auto px-6 mb-16">
          <h2 className="text-2xl font-bold mb-6 text-amber-400">Próximo Culto</h2>
          <div className="card-dark">
            <p className="text-zinc-400 text-sm mb-1">
              {new Date((proximoCulto as any).data).toLocaleDateString('pt-PT', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
            <h3 className="text-xl font-semibold">{(proximoCulto as any).titulo}</h3>
            {(proximoCulto as any).descricao && (
              <p className="text-zinc-400 mt-2">{(proximoCulto as any).descricao}</p>
            )}
          </div>
        </section>
      )}

      {/* Cultos Recentes */}
      {cultosRecentes.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-amber-400">Cultos Recentes</h2>
            <Link href="/arquivo" className="text-zinc-400 hover:text-amber-400 text-sm transition-colors">Ver todos →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cultosRecentes.map(culto => (
              <CultoCard key={(culto as any)._id.toString()} culto={{ ...(culto as any), _id: (culto as any)._id.toString() }} />
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 text-center text-zinc-500 text-sm">
        <p>© {new Date().getFullYear()} Igreja. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
