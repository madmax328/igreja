export const dynamic = 'force-dynamic'

import { connectDB } from '@/lib/mongodb'
import Culto from '@/models/Culto'
import CultoCard from '@/components/CultoCard'
import Link from 'next/link'

async function getCultos() {
  await connectDB()
  return Culto.find({ status: { $in: ['gravado', 'publicado'] } }).sort({ data: -1 }).lean()
}

export default async function ArquivoPage() {
  const cultos = await getCultos()

  return (
    <div className="min-h-screen bg-zinc-950">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-amber-400 font-bold text-xl">Igreja</Link>
        <Link href="/live" className="text-zinc-400 hover:text-white text-sm transition-colors">Live</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Arquivo de Cultos</h1>
        <p className="text-zinc-400 mb-8">Reveja os cultos anteriores</p>

        {cultos.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <p>Ainda não há cultos gravados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cultos.map(culto => (
              <CultoCard
                key={(culto as any)._id.toString()}
                culto={{ ...(culto as any), _id: (culto as any)._id.toString() }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
