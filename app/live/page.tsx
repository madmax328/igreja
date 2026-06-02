export const dynamic = 'force-dynamic'

import { connectDB } from '@/lib/mongodb'
import Culto from '@/models/Culto'
import LivePlayer from '@/components/LivePlayer'
import Link from 'next/link'

async function getLive() {
  await connectDB()
  return Culto.findOne({ status: 'ao_vivo' }).lean()
}

export default async function LivePage() {
  const cultoAoVivo = await getLive()

  return (
    <div className="min-h-screen bg-zinc-950">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-amber-400 font-bold text-xl">Igreja</Link>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-400 text-sm font-medium">AO VIVO</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {cultoAoVivo ? (
          <>
            <h1 className="text-2xl font-bold mb-2">{(cultoAoVivo as any).titulo}</h1>
            <p className="text-zinc-400 mb-6">
              {new Date((cultoAoVivo as any).data).toLocaleDateString('pt-PT', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
            <LivePlayer roomName={(cultoAoVivo as any).livekit_room} />
          </>
        ) : (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">☩</p>
            <h1 className="text-2xl font-bold mb-2">Nenhum culto ao vivo de momento</h1>
            <p className="text-zinc-400 mb-6">Consulta o nosso arquivo de cultos anteriores.</p>
            <Link href="/arquivo" className="btn-gold">Ver Arquivo</Link>
          </div>
        )}
      </div>
    </div>
  )
}
