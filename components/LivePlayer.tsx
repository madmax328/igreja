'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import {
  LiveKitRoom,
  useTracks,
  useLocalParticipant,
  useRoomContext,
} from '@livekit/components-react'
import { Track, RoomEvent, DataPacket_Kind } from 'livekit-client'
import '@livekit/components-styles'

interface Mensagem {
  autor: string
  texto: string
  ts: number
}

// Renderiza o vídeo principal (o broadcaster com mais tracks)
function VideoView({ trackRef }: { trackRef: any }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const track = trackRef?.publication?.track
    if (track && videoRef.current) {
      track.attach(videoRef.current)
      return () => { track.detach(videoRef.current!) }
    }
  }, [trackRef])

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
    />
  )
}

function AudioView({ trackRef }: { trackRef: any }) {
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

function PlayerInterno({ nome }: { nome: string }) {
  const videoTracks = useTracks([Track.Source.Camera], { onlySubscribed: true })
  const audioTracks = useTracks([Track.Source.Microphone], { onlySubscribed: true })
  const room = useRoomContext()
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [texto, setTexto] = useState('')
  const [chatAberto, setChatAberto] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  // Receber mensagens de chat
  useEffect(() => {
    const handler = (payload: Uint8Array, participant: any) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload))
        if (msg.tipo === 'chat') {
          setMensagens(prev => [...prev, { autor: participant?.identity || 'Anónimo', texto: msg.texto, ts: Date.now() }])
        }
      } catch {}
    }
    room.on(RoomEvent.DataReceived, handler)
    return () => { room.off(RoomEvent.DataReceived, handler) }
  }, [room])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [mensagens])

  function enviarMensagem(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim()) return
    const msg = JSON.stringify({ tipo: 'chat', texto: texto.trim() })
    room.localParticipant.publishData(new TextEncoder().encode(msg), { reliable: true })
    setMensagens(prev => [...prev, { autor: nome, texto: texto.trim(), ts: Date.now() }])
    setTexto('')
  }

  const temVideo = videoTracks.length > 0

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Vídeo */}
      <div className="flex-1 relative bg-black rounded-xl overflow-hidden" style={{ minHeight: '300px' }}>
        {temVideo ? (
          <VideoView trackRef={videoTracks[0]} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-zinc-600">
              <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">À espera do broadcaster...</p>
            </div>
          </div>
        )}

        {/* Áudio (invisível) */}
        {audioTracks.map((t, i) => <AudioView key={i} trackRef={t} />)}

        {/* Badge ao vivo */}
        {temVideo && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 px-2 py-1 rounded text-xs font-bold">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            AO VIVO
          </div>
        )}

        {/* Botão chat mobile */}
        <button
          onClick={() => setChatAberto(!chatAberto)}
          className="absolute bottom-3 right-3 lg:hidden bg-black/60 text-white px-3 py-2 rounded-lg text-sm"
        >
          💬 Chat
        </button>
      </div>

      {/* Chat */}
      <div className={`lg:w-80 flex flex-col bg-zinc-900 rounded-xl overflow-hidden ${chatAberto ? 'block' : 'hidden lg:flex'}`} style={{ minHeight: '300px' }}>
        <div className="px-4 py-3 border-b border-zinc-800 font-medium text-sm flex justify-between items-center">
          <span>Chat ao vivo</span>
          <button onClick={() => setChatAberto(false)} className="lg:hidden text-zinc-500">✕</button>
        </div>
        <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: '400px' }}>
          {mensagens.length === 0 && (
            <p className="text-zinc-600 text-sm text-center mt-4">Nenhuma mensagem ainda.</p>
          )}
          {mensagens.map((m, i) => (
            <div key={i} className="text-sm">
              <span className="text-gold-400 font-medium">{m.autor}: </span>
              <span className="text-zinc-300">{m.texto}</span>
            </div>
          ))}
        </div>
        <form onSubmit={enviarMensagem} className="p-3 border-t border-zinc-800 flex gap-2">
          <input
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="Escreve uma mensagem..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-gold-500 focus:outline-none"
            maxLength={200}
          />
          <button type="submit" className="btn-gold text-sm px-3 py-2">→</button>
        </form>
      </div>
    </div>
  )
}

interface LivePlayerProps {
  roomName: string
  nomeViewer?: string
}

export default function LivePlayer({ roomName, nomeViewer }: LivePlayerProps) {
  const [token, setToken] = useState<string | null>(null)
  const [wsUrl, setWsUrl] = useState<string>('')
  const nome = nomeViewer || `Visitante-${Math.random().toString(36).slice(2, 6)}`

  useEffect(() => {
    fetch(`/api/live/viewer-token?room=${roomName}&nome=${encodeURIComponent(nome)}`)
      .then(r => r.json())
      .then(data => { setToken(data.token); setWsUrl(data.livekitUrl) })
  }, [roomName])

  if (!token) {
    return (
      <div className="flex items-center justify-center h-64 bg-zinc-900 rounded-xl">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-zinc-400">A conectar à live...</p>
        </div>
      </div>
    )
  }

  return (
    <LiveKitRoom serverUrl={wsUrl} token={token} video={false} audio={false} connect={true}>
      <PlayerInterno nome={nome} />
    </LiveKitRoom>
  )
}
