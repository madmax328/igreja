'use client'
import { useState, useEffect, useRef } from 'react'
import {
  LiveKitRoom,
  useLocalParticipant,
  useTracks,
  useRoomContext,
  useParticipants,
} from '@livekit/components-react'
import { Track, RoomEvent } from 'livekit-client'
import '@livekit/components-styles'

interface BroadcastStudioProps {
  cultoId: string
  cultoTitulo: string
}

interface Mensagem {
  autor: string
  texto: string
  ts: number
}

// Preview do vídeo local
function LocalVideoPreview() {
  const tracks = useTracks([Track.Source.Camera])
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const track = tracks.find(t => t.participant.isLocal)?.publication?.track
    if (track && videoRef.current) {
      track.attach(videoRef.current)
      return () => { track.detach(videoRef.current!) }
    }
  }, [tracks])

  const temVideo = tracks.some(t => t.participant.isLocal)

  return (
    <div className="relative w-full aspect-video bg-zinc-950 rounded-xl overflow-hidden">
      {temVideo ? (
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
          <div className="text-center">
            <div className="text-4xl mb-2">📷</div>
            <p className="text-sm">Câmera desligada</p>
          </div>
        </div>
      )}
    </div>
  )
}

function EstudioControls({ cultoId, onEnd }: { cultoId: string; onEnd: () => void }) {
  const { localParticipant } = useLocalParticipant()
  const participants = useParticipants()
  const room = useRoomContext()
  const [isLive, setIsLive] = useState(false)
  const [camAtiva, setCamAtiva] = useState(false)
  const [micAtivo, setMicAtivo] = useState(false)
  const [camaraFrontal, setCamaraFrontal] = useState(false)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [deviceSelecionado, setDeviceSelecionado] = useState<string>('')
  const [erro, setErro] = useState('')
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [texto, setTexto] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)

  // Listar câmeras disponíveis
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devs => {
      const cameras = devs.filter(d => d.kind === 'videoinput')
      setDevices(cameras)
    }).catch(() => {})
  }, [])

  // Receber mensagens de chat
  useEffect(() => {
    const handler = (payload: Uint8Array, participant: any) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload))
        if (msg.tipo === 'chat') {
          setMensagens(prev => [...prev, {
            autor: participant?.identity || 'Visitante',
            texto: msg.texto,
            ts: Date.now(),
          }])
        }
      } catch {}
    }
    room.on(RoomEvent.DataReceived, handler)
    return () => { room.off(RoomEvent.DataReceived, handler) }
  }, [room])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [mensagens])

  async function ativarCam(frontal: boolean, deviceId?: string) {
    try {
      setErro('')
      const facingMode = frontal ? 'user' : 'environment'
      const opts: any = deviceId
        ? { deviceId: { exact: deviceId } }
        : { facingMode }
      await localParticipant.setCameraEnabled(true, opts)
      setCamAtiva(true)
      setCamaraFrontal(frontal)
    } catch {
      setErro('Não foi possível aceder à câmera. Verifica as permissões.')
    }
  }

  async function toggleCam() {
    if (camAtiva) {
      await localParticipant.setCameraEnabled(false)
      setCamAtiva(false)
    } else {
      await ativarCam(camaraFrontal)
    }
  }

  async function virarCamara() {
    const novaFrontal = !camaraFrontal
    try {
      await localParticipant.setCameraEnabled(false)
      await ativarCam(novaFrontal)
    } catch {
      setErro('Não foi possível mudar de câmera.')
    }
  }

  async function mudarDevice(deviceId: string) {
    setDeviceSelecionado(deviceId)
    await localParticipant.setCameraEnabled(false)
    await ativarCam(camaraFrontal, deviceId)
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

  async function handleGoLive() {
    try {
      setErro('')
      if (!camAtiva) await ativarCam(false)
      if (!micAtivo) { await localParticipant.setMicrophoneEnabled(true); setMicAtivo(true) }
      setIsLive(true)
    } catch {
      setErro('Erro ao iniciar. Verifica câmera e microfone.')
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

  function enviarMensagem(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim()) return
    const msg = JSON.stringify({ tipo: 'chat', texto: texto.trim() })
    room.localParticipant.publishData(new TextEncoder().encode(msg), { reliable: true })
    setMensagens(prev => [...prev, { autor: 'Admin', texto: texto.trim(), ts: Date.now() }])
    setTexto('')
  }

  const espectadores = participants.filter(p => !p.isLocal).length

  return (
    <div className="space-y-4">
      {/* Preview */}
      <LocalVideoPreview />

      {erro && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">
          {erro}
        </div>
      )}

      {/* Controlos de câmera/mic */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={toggleCam} className={`py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${camAtiva ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
          {camAtiva ? '📷 Câmera ON' : '📷 Câmera OFF'}
        </button>
        <button onClick={toggleMic} className={`py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${micAtivo ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
          {micAtivo ? '🎤 Mic ON' : '🎤 Mic OFF'}
        </button>
      </div>

      {/* Virar câmera (mobile) */}
      {camAtiva && (
        <div className="flex gap-2">
          <button
            onClick={virarCamara}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            🔄 {camaraFrontal ? 'Usar câmera traseira' : 'Usar câmera frontal'}
          </button>
        </div>
      )}

      {/* Seleção de câmera específica (se houver múltiplas) */}
      {devices.length > 1 && (
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Seleccionar câmera:</label>
          <select
            value={deviceSelecionado}
            onChange={e => mudarDevice(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="">Automático</option>
            {devices.map(d => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Câmera ${d.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Status da live */}
      {isLive && (
        <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 font-semibold text-sm">AO VIVO</span>
          </div>
          <span className="text-zinc-400 text-sm">{espectadores} espectador{espectadores !== 1 ? 'es' : ''}</span>
        </div>
      )}

      {/* Botão principal */}
      {!isLive ? (
        <button onClick={handleGoLive} className="btn-gold w-full py-4 text-base">
          🔴 Iniciar Live
        </button>
      ) : (
        <button onClick={handleEndLive} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 rounded-lg transition-colors">
          ⏹ Terminar Live
        </button>
      )}

      {/* Chat do admin */}
      <div className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
        <div className="px-4 py-3 border-b border-zinc-800 text-sm font-medium flex justify-between">
          <span>Chat ao vivo</span>
          <span className="text-zinc-500">{espectadores} online</span>
        </div>
        <div ref={chatRef} className="p-3 space-y-2 overflow-y-auto" style={{ height: '180px' }}>
          {mensagens.length === 0 && (
            <p className="text-zinc-600 text-sm text-center mt-4">Sem mensagens ainda.</p>
          )}
          {mensagens.map((m, i) => (
            <div key={i} className="text-sm">
              <span className={`font-medium ${m.autor === 'Admin' ? 'text-gold-400' : 'text-blue-400'}`}>{m.autor}: </span>
              <span className="text-zinc-300">{m.texto}</span>
            </div>
          ))}
        </div>
        <form onSubmit={enviarMensagem} className="p-3 border-t border-zinc-800 flex gap-2">
          <input
            value={texto}
            onChange={e => setTexto(e.target.value)}
            placeholder="Responder no chat..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:border-gold-500 focus:outline-none"
            maxLength={200}
          />
          <button type="submit" className="btn-gold text-sm px-3">→</button>
        </form>
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
      if (!res.ok) throw new Error()
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
        <p className="text-2xl text-gold-400 font-semibold mb-2">Live encerrada ✓</p>
        <p className="text-zinc-400">A gravação está a ser processada.</p>
      </div>
    )
  }

  if (!roomData) {
    return (
      <div className="card-dark text-center py-10">
        <h2 className="text-xl font-semibold mb-2">{cultoTitulo}</h2>
        <p className="text-zinc-400 mb-6 text-sm">Entra no estúdio para começar a transmitir</p>
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
        <EstudioControls cultoId={cultoId} onEnd={() => setEnded(true)} />
      </LiveKitRoom>
    </div>
  )
}
