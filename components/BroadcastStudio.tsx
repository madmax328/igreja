'use client'
import { useState, useEffect, useRef } from 'react'
import {
  LiveKitRoom,
  useLocalParticipant,
  useTracks,
  RoomAudioRenderer,
} from '@livekit/components-react'
import { Track } from 'livekit-client'
import '@livekit/components-styles'

interface BroadcastStudioProps {
  cultoId: string
  cultoTitulo: string
}

function CameraPreview() {
  const tracks = useTracks([Track.Source.Camera])
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const track = tracks[0]?.publication?.track
    if (track && videoRef.current) {
      track.attach(videoRef.current)
      return () => { track.detach(videoRef.current!) }
    }
  }, [tracks])

  if (tracks.length === 0) {
    return (
      <div className="w-full aspect-video bg-zinc-900 rounded-xl flex items-center justify-center">
        <div className="text-center text-zinc-600">
          <div className="text-4xl mb-2">📷</div>
          <p className="text-sm">Câmera desligada</p>
        </div>
      </div>
    )
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className="w-full aspect-video bg-black rounded-xl object-cover"
    />
  )
}

function StudioControls({ cultoId, onEnd }: { cultoId: string; onEnd: () => void }) {
  const { localParticipant } = useLocalParticipant()
  const [isLive, setIsLive] = useState(false)
  const [viewers] = useState(0)
  const [camAtiva, setCamAtiva] = useState(false)
  const [micAtivo, setMicAtivo] = useState(false)
  const [erro, setErro] = useState('')

  async function toggleCam() {
    try {
      setErro('')
      const novoEstado = !camAtiva
      await localParticipant.setCameraEnabled(novoEstado)
      setCamAtiva(novoEstado)
    } catch {
      setErro('Não foi possível aceder à câmera. Verifica as permissões do browser.')
    }
  }

  async function toggleMic() {
    try {
      const novoEstado = !micAtivo
      await localParticipant.setMicrophoneEnabled(novoEstado)
      setMicAtivo(novoEstado)
    } catch {
      setErro('Não foi possível aceder ao microfone.')
    }
  }

  async function handleGoLive() {
    try {
      setErro('')
      if (!camAtiva) await localParticipant.setCameraEnabled(true).then(() => setCamAtiva(true))
      if (!micAtivo) await localParticipant.setMicrophoneEnabled(true).then(() => setMicAtivo(true))
      setIsLive(true)
    } catch {
      setErro('Erro ao iniciar a live. Verifica as permissões de câmera e microfone.')
    }
  }

  async function handleEndLive() {
    await localParticipant.setCameraEnabled(false)
    await localParticipant.setMicrophoneEnabled(false)
    await fetch('/api/live/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cultoId }),
    })
    setIsLive(false)
    onEnd()
  }

  return (
    <div className="space-y-4">
      <CameraPreview />

      {erro && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">
          {erro}
        </div>
      )}

      {/* Controlos câmera/mic */}
      {!isLive && (
        <div className="flex gap-3">
          <button
            onClick={toggleCam}
            className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              camAtiva
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}
          >
            {camAtiva ? '📷 Câmera ON' : '📷 Câmera OFF'}
          </button>
          <button
            onClick={toggleMic}
            className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              micAtivo
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}
          >
            {micAtivo ? '🎤 Mic ON' : '🎤 Mic OFF'}
          </button>
        </div>
      )}

      {/* Botão principal */}
      <div className="flex items-center gap-4 flex-wrap">
        {!isLive ? (
          <button onClick={handleGoLive} className="btn-gold w-full py-4 text-lg">
            🔴 Iniciar Live
          </button>
        ) : (
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 font-semibold">AO VIVO</span>
              </div>
              <span className="text-zinc-400 text-sm">{viewers} espectadores</span>
            </div>
            <button
              onClick={handleEndLive}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 rounded-lg transition-colors"
            >
              Terminar Live
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BroadcastStudio({ cultoId, cultoTitulo }: BroadcastStudioProps) {
  const [roomData, setRoomData] = useState<{ token: string; roomName: string; livekitUrl: string } | null>(null)
  const [ended, setEnded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function startSession() {
    setLoading(true)
    setErro('')
    try {
      const res = await fetch('/api/live/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cultoId }),
      })
      if (!res.ok) throw new Error('Erro ao iniciar sessão')
      const data = await res.json()
      setRoomData(data)
    } catch {
      setErro('Não foi possível ligar ao servidor. Verifica a configuração do LiveKit.')
    }
    setLoading(false)
  }

  if (ended) {
    return (
      <div className="card-dark text-center py-12">
        <p className="text-2xl text-gold-400 font-semibold mb-2">Live encerrada</p>
        <p className="text-zinc-400">A gravação está a ser processada automaticamente.</p>
      </div>
    )
  }

  if (!roomData) {
    return (
      <div className="card-dark text-center py-10">
        <h2 className="text-xl font-semibold mb-2">{cultoTitulo}</h2>
        <p className="text-zinc-400 mb-6 text-sm">Clica para entrar no estúdio de transmissão</p>
        {erro && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
            {erro}
          </div>
        )}
        <button onClick={startSession} disabled={loading} className="btn-gold text-lg px-8 py-4 w-full">
          {loading ? 'A conectar...' : 'Entrar no Estúdio'}
        </button>
      </div>
    )
  }

  return (
    <div className="card-dark">
      <h2 className="text-lg font-semibold mb-4">{cultoTitulo}</h2>
      <LiveKitRoom
        serverUrl={roomData.livekitUrl}
        token={roomData.token}
        video={false}
        audio={false}
        connect={true}
      >
        <RoomAudioRenderer />
        <StudioControls cultoId={cultoId} onEnd={() => setEnded(true)} />
      </LiveKitRoom>
    </div>
  )
}
