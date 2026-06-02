import Link from 'next/link'

interface CultoCardProps {
  culto: {
    _id: string
    titulo: string
    data: string
    descricao: string
    status: string
    gravacao_url?: string
    duracao?: number
  }
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

export default function CultoCard({ culto }: CultoCardProps) {
  const statusColors: Record<string, string> = {
    agendado: 'bg-blue-500/20 text-blue-400',
    ao_vivo: 'bg-red-500/20 text-red-400',
    gravado: 'bg-zinc-500/20 text-zinc-400',
    publicado: 'bg-green-500/20 text-green-400',
  }

  const statusLabels: Record<string, string> = {
    agendado: 'Agendado',
    ao_vivo: 'Ao Vivo',
    gravado: 'Gravado',
    publicado: 'Publicado',
  }

  return (
    <div className="card-dark hover:border-gold-500/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[culto.status] || 'bg-zinc-700 text-zinc-300'}`}>
          {culto.status === 'ao_vivo' && <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1" />}
          {statusLabels[culto.status] || culto.status}
        </span>
        {culto.duracao && (
          <span className="text-xs text-zinc-500">{formatDuration(culto.duracao)}</span>
        )}
      </div>
      <h3 className="font-semibold text-white mb-1">{culto.titulo}</h3>
      <p className="text-sm text-zinc-400 mb-3">
        {new Date(culto.data).toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
      {culto.descricao && (
        <p className="text-sm text-zinc-500 line-clamp-2 mb-4">{culto.descricao}</p>
      )}
      {culto.status === 'ao_vivo' && (
        <Link href="/live" className="btn-gold text-sm w-full block text-center">
          Assistir Agora
        </Link>
      )}
      {(culto.status === 'gravado' || culto.status === 'publicado') && culto.gravacao_url && (
        <a href={culto.gravacao_url} target="_blank" rel="noopener noreferrer" className="text-gold-400 hover:text-gold-300 text-sm font-medium">
          Ver gravação →
        </a>
      )}
    </div>
  )
}
