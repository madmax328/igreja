'use client'
import { useEffect, useRef, useState } from 'react'
import {
  LiveKitRoom,
  useTracks,
  useParticipants,
  useRoomContext,
} from '@livekit/components-react'
import { Track, RoomEvent, Participant } from 'livekit-client'
import '@livekit/components-styles'

interface Mensagem {
  autor: string
  texto: string
}

// Thumbnail de vídeo de um participante
function CameraThumbnail({
  participant,
  ativo,
  onClick,
}: {
  participant: Participant
  ativo: boolean
  onClick: () => void
}) {
  const tracks = useTracks([Track.Source.Camera])
  const videoRef = useRef<HTMLVideoElement>(null)
  const trackSidRef = useRef<string | null>(null)

  const trackRef = tracks.find(t => t.participant.identity === participant.identity)

  useEffect(() => {
    const track = trackRef?.publication?.track
    const sid = trackRef?.publication?.trackSid
    if (!track || !videoRef.current) return
    if (sid === trackSidRef.current) return
    trackSidRef.current = sid || null
    track.attach(videoRef.current)
    return () => { track.detach(videoRef.current!); trackSidRef.current = null }
  }, [trackRef])

  const temVideo = !!trackRef?.publication?.track

  return (
    <button
      onClick={onClick}
      className={`relative rounded-xl overflow-hidden aspect-video w-full transition-all ${
        ativo
          ? 'ring-4 ring-gold-500 ring-offset-2 ring-offset-zinc-950'
          : 'ring-1 ring-zinc-700 hover:ring-zinc-500'
      }`}
    >
      {temVideo ? (
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover bg-black" />
      ) : (
        <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-600 text-sm">
          Sem vídeo
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
        <p className="text-xs text-white font-medium truncate">
          {participant.identity.replace('camera-', 'Câmera ')}
        </p>
      </div>
      {ativo && (
        <div className="absolute top-2 right-2 bg-gold-500 text-black text-xs font-bold px-1.5 py-0.5 rounded">
          AO VIVO
        </div>
      )}
    </button>
  )
}

// Vídeo principal (câmera selecionada pelo director)
function MainVideo({ identity }: { identity: string | null }) {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: true })
  const audioTracks = useTracks([Track.Source.Microphone], { onlySubscribed: true })
  const videoRef = useRef<HTMLVideoElement>(null)
  const trackSidRef = useRef<string | null>(null)

  const trackRef = identity ? tracks.find(t => t.participant.identity === identity) : tracks[0]

  useEffect(() => {
    const track = trackRef?.publication?.track
    const sid = trackRef?.publication?.trackSid
    if (!track || !videoRef.current) return
    if (sid === trackSidRef.current) return
    trackSidRef.current = sid || null
    track.attach(videoRef.current)
    return () => { track.detach(videoRef.current!); trackSidRef.current = null }
  }, [trackRef])

  return (
    <div className="relative w-full aspect-video bg-zinc-950 rounded-xl overflow-hidden">
      <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
      {audioTracks.filter(t => t.participant.identity === identity).map((t, i) => (
        <AudioPlayer key={i} trackRef={t} />
      ))}
      {!trackRef && (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
          <div className="text-center">
            <div className="text-4xl mb-2">📡</div>
            <p className="text-sm">Nenhuma câmera activa</p>
          </div>
        </div>
      )}
    </div>
  )
}

function AudioPlayer({ trackRef }: { trackRef: any }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  useEffect(() => {
    const track = trackRef?.publication?.track
    if (track && audioRef.current) {
      track.attach(audioRef.current)
      return () => { track.detach(audioRef.current!) }
    }
  }, [trackRef])
  return <audio ref={audioRef} autoPlay />
}

function DirectorControls({ cultoId, onEnd }: { cultoId: string; onEnd: () => void }) {
  const room = useRoomContext()
  const participants = useParticipants()
  const [cameraAtiva, setCameraAtiva] = useState<string | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [texto, setTexto] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)

  // Câmeras = participantes que não são o director nem viewers
  const cameras = participants.filter(p =>
    p.identity.startsWith('camera-') && !p.isLocal
  )

  // Selecionar automaticamente a primeira câmera disponível
  useEffect(() => {
    if (cameras.length > 0 && !cameraAtiva) {
      selecionarCamera(cameras[0].identity)
    }
  }, [cameras.length])

  // Receber mensagens
  useEffect(() => {
    const handler = (payload: Uint8Array, participant: any) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload))
        if (msg.tipo === 'chat') {
          setMensagens(prev => [...prev, { autor: participant?.identity || 'Visitante', texto: msg.texto }])
        }
      } catch {}
    }
    room.on(RoomEvent.DataReceived, handler)
    return () => { room.off(RoomEvent.DataReceived, handler) }
  }, [room])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [mensagens])

  function selecionarCamera(identity: string) {
    setCameraAtiva(identity)
    // Envia sinal a todos os viewers
    const msg = JSON.stringify({ tipo: 'director', cameraId: identity })
    room.localParticipant.publishData(new TextEncoder().encode(msg), { reliable: true })
  }

  async function terminarLive() {
    await fetch('/api/live/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cultoId }),
    })
    onEnd()
  }

  function enviarMensagem(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim()) return
    const msg = JSON.stringify({ tipo: 'chat', texto: texto.trim() })
    room.localParticipant.publishData(new TextEncoder().encode(msg), { reliable: true })
    setMensagens(prev => [...prev, { autor: 'Director', texto: texto.trim() }])
    setTexto('')
  }

  const viewers = participants.filter(p => p.identity.startsWith('viewer-')).length

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Coluna principal */}
      <div className="flex-1 space-y-4">
        {/* Monitor principal */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-zinc-400 font-medium">
              Monitor principal {cameraAtiva ? `— ${cameraAtiva.replace('camera-', 'Câmera ')}` : ''}
            </p>
            <span className="text-zinc-500 text-sm">{viewers} espectador{viewers !== 1 ? 'es' : ''}</span>
          </div>
          <MainVideo identity={cameraAtiva} />
        </div>

        {/* Grid de câmeras */}
        <div>
          <p className="text-sm text-zinc-400 font-medium mb-2">
            Câmeras activas ({cameras.length})
          </p>
          {cameras.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center text-zinc-600 text-sm">
              Nenhuma câmera conectada. As câmeras aparecem aqui quando os operadores entram.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {cameras.map(p => (
                <CameraThumbnail
                  key={p.identity}
                  participant={p}
                  ativo={p.identity === cameraAtiva}
                  onClick={() => selecionarCamera(p.identity)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Botão terminar */}
        <button
          onClick={terminarLive}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          ⏹ Terminar Live
        </button>
      </div>

      {/* Chat */}
      <div className="lg:w-72 flex flex-col bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800" style={{ minHeight: '300px' }}>
        <div className="px-4 py-3 border-b border-zinc-800 text-sm font-medium">
          Chat ao vivo
        </div>
        <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: '400px' }}>
          {mensagens.length === 0 && (
            <p className="text-zinc-600 text-sm text-center mt-4">Sem mensagens.</p>
          )}
          {mensagens.map((m, i) => (
            <div key={i} className="text-sm">
              <span className={`font-medium ${m.autor === 'Director' ? 'text-gold-400' : 'text-blue-400'}`}>
                {m.autor}:{' '}
              </span>
              <span className="text-zinc-300">{m.texto}</span>
            </div>
          ))}
        </div>
        <form onSubmit={enviarMensagem} className="p-3 border-t border-zinc-800 flex gap-2">
          <input
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="Mensagem..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-gold-500 focus:outline-none"
            maxLength={200}
          />
          <button type="submit" className="btn-gold text-sm px-3">→</button>
        </form>
      </div>
    </div>
  )
}

interface Props {
  cultoId: string
  cultoTitulo: string
  onEnd: () => void
}

export default function DirectorView({ cultoId, cultoTitulo, onEnd }: Props) {
  const [roomData, setRoomData] = useState<{ token: string; roomName: string; livekitUrl: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function entrar() {
    setLoading(true)
    setErro('')
    try {
      const res = await fetch('/api/live/director-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cultoId }),
      })
      if (!res.ok) throw new Error()
      setRoomData(await res.json())
    } catch {
      setErro('Não foi possível ligar. Verifica o LiveKit.')
    }
    setLoading(false)
  }

  if (!roomData) {
    return (
      <div className="card-dark text-center py-10">
        <h2 className="text-xl font-semibold mb-2">{cultoTitulo}</h2>
        <p className="text-zinc-400 mb-6 text-sm">Entra como Director para gerir as câmeras</p>
        {erro && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
            {erro}
          </div>
        )}
        <button onClick={entrar} disabled={loading} className="btn-gold text-lg px-8 py-4 w-full">
          {loading ? 'A conectar...' : '🎬 Entrar como Director'}
        </button>
      </div>
    )
  }

  return (
    <LiveKitRoom
      serverUrl={roomData.livekitUrl}
      token={roomData.token}
      video={false}
      audio={false}
      connect={true}
    >
      <DirectorControls cultoId={cultoId} onEnd={onEnd} />
    </LiveKitRoom>
  )
}
