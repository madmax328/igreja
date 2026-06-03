'use client'
import { useState, useEffect, useRef } from 'react'
import { LiveKitRoom, useLocalParticipant, useTracks } from '@livekit/components-react'
import { Track } from 'livekit-client'
import '@livekit/components-styles'

interface Props {
  cultoId: string
  cultoTitulo: string
}

function LocalPreview({ cameraId }: { cameraId: string }) {
  const { localParticipant } = useLocalParticipant()
  const tracks = useTracks([Track.Source.Camera])
  const videoRef = useRef<HTMLVideoElement>(null)
  const trackSidRef = useRef<string | null>(null)
  const [camAtiva, setCamAtiva] = useState(false)
  const [micAtivo, setMicAtivo] = useState(false)
  const [frontal, setFrontal] = useState(false)
  const [erro, setErro] = useState('')
  const [isLive, setIsLive] = useState(false)

  // Attach track estável — só muda quando o SID da track muda
  useEffect(() => {
    const localTrack = tracks.find(t => t.participant.isLocal)
    const track = localTrack?.publication?.track
    const sid = localTrack?.publication?.trackSid

    if (!track || !videoRef.current) return
    if (sid === trackSidRef.current) return // mesma track, não re-attach

    trackSidRef.current = sid || null
    track.attach(videoRef.current)
    return () => {
      track.detach(videoRef.current!)
      trackSidRef.current = null
    }
  }, [tracks])

  async function ligarCam(usarFrontal: boolean) {
    try {
      setErro('')
      await localParticipant.setCameraEnabled(true, { facingMode: usarFrontal ? 'user' : 'environment' })
      setCamAtiva(true)
      setFrontal(usarFrontal)
    } catch {
      setErro('Não foi possível aceder à câmera.')
    }
  }

  async function virar() {
    const novaFrontal = !frontal
    await localParticipant.setCameraEnabled(false)
    await ligarCam(novaFrontal)
  }

  async function toggleMic() {
    try {
      const novo = !micAtivo
      await localParticipant.setMicrophoneEnabled(novo)
      setMicAtivo(novo)
    } catch {
      setErro('Não foi possível aceder ao microfone.')
    }
  }

  async function goLive() {
    if (!camAtiva) await ligarCam(false)
    if (!micAtivo) { await localParticipant.setMicrophoneEnabled(true); setMicAtivo(true) }
    setIsLive(true)
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gold-400 font-bold">Câmera</p>
          <p className="text-zinc-500 text-xs font-mono">{cameraId.slice(-8)}</p>
        </div>
        {isLive && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-lg">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-sm font-semibold">AO VIVO</span>
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="flex-1 relative bg-zinc-900 rounded-2xl overflow-hidden" style={{ minHeight: '60vw' }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover ${!camAtiva ? 'hidden' : ''}`}
        />
        {!camAtiva && (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
            <div className="text-center">
              <div className="text-5xl mb-3">📷</div>
              <p className="text-sm">Câmera desligada</p>
            </div>
          </div>
        )}
        {/* Botão virar câmera sobreposto */}
        {camAtiva && (
          <button
            onClick={virar}
            className="absolute top-3 right-3 bg-black/50 text-white p-2.5 rounded-full text-xl"
          >
            🔄
          </button>
        )}
      </div>

      {erro && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
          {erro}
        </div>
      )}

      {/* Controlos */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => camAtiva ? localParticipant.setCameraEnabled(false).then(() => setCamAtiva(false)) : ligarCam(frontal)}
          className={`py-4 rounded-xl text-sm font-semibold transition-colors ${camAtiva ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'bg-zinc-800 text-zinc-400'}`}
        >
          {camAtiva ? '📷 Câmera ON' : '📷 Câmera OFF'}
        </button>
        <button
          onClick={toggleMic}
          className={`py-4 rounded-xl text-sm font-semibold transition-colors ${micAtivo ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'bg-zinc-800 text-zinc-400'}`}
        >
          {micAtivo ? '🎤 Mic ON' : '🎤 Mic OFF'}
        </button>
      </div>

      {!isLive ? (
        <button onClick={goLive} className="btn-gold w-full py-5 text-lg rounded-xl">
          🔴 Iniciar Transmissão
        </button>
      ) : (
        <div className="text-center text-zinc-500 text-sm py-2">
          A transmitir. O director controla o que os espectadores vêem.
        </div>
      )}
    </div>
  )
}

export default function CameraOperator({ cultoId, cultoTitulo }: Props) {
  const [roomData, setRoomData] = useState<{ token: string; cameraId: string; roomName: string; livekitUrl: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function entrar() {
    setLoading(true)
    setErro('')
    try {
      const res = await fetch('/api/live/camera-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cultoId }),
      })
      if (!res.ok) throw new Error()
      setRoomData(await res.json())
    } catch {
      setErro('Não foi possível ligar. Tenta novamente.')
    }
    setLoading(false)
  }

  if (!roomData) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <p className="text-gold-400 font-bold text-xl mb-1">Câmera</p>
          <p className="text-zinc-400 text-sm mb-8">{cultoTitulo}</p>
          {erro && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
              {erro}
            </div>
          )}
          <button onClick={entrar} disabled={loading} className="btn-gold w-full py-5 text-lg rounded-xl">
            {loading ? 'A conectar...' : 'Entrar como Câmera'}
          </button>
        </div>
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
      <LocalPreview cameraId={roomData.cameraId} />
    </LiveKitRoom>
  )
}
