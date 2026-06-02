'use client'
import { useState } from 'react'
import { LiveKitRoom, useLocalParticipant, RoomAudioRenderer } from '@livekit/components-react'
import '@livekit/components-styles'

interface BroadcastStudioProps {
  cultoId: string
  cultoTitulo: string
}

function StudioControls({ cultoId, onEnd }: { cultoId: string; onEnd: () => void }) {
  const { localParticipant } = useLocalParticipant()
  const [isLive, setIsLive] = useState(false)
  const [viewers] = useState(0)

  async function handleGoLive() {
    await localParticipant.setCameraEnabled(true)
    await localParticipant.setMicrophoneEnabled(true)
    setIsLive(true)
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
    <div className="mt-4 flex items-center gap-4">
      {!isLive ? (
        <button onClick={handleGoLive} className="btn-gold text-lg px-8 py-3">
          Iniciar Live
        </button>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 font-semibold">AO VIVO</span>
          </div>
          <span className="text-zinc-400">{viewers} espectadores</span>
          <button onClick={handleEndLive} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors">
            Terminar Live
          </button>
        </>
      )}
    </div>
  )
}

export default function BroadcastStudio({ cultoId, cultoTitulo }: BroadcastStudioProps) {
  const [roomData, setRoomData] = useState<{ token: string; roomName: string; livekitUrl: string } | null>(null)
  const [ended, setEnded] = useState(false)
  const [loading, setLoading] = useState(false)

  async function startSession() {
    setLoading(true)
    const res = await fetch('/api/live/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cultoId }),
    })
    const data = await res.json()
    setRoomData(data)
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
      <div className="card-dark text-center py-12">
        <h2 className="text-xl font-semibold mb-2">{cultoTitulo}</h2>
        <p className="text-zinc-400 mb-6">Clica para iniciar a sessão de transmissão</p>
        <button onClick={startSession} disabled={loading} className="btn-gold text-lg px-8 py-3">
          {loading ? 'A preparar...' : 'Entrar no Estúdio'}
        </button>
      </div>
    )
  }

  return (
    <div className="card-dark">
      <h2 className="text-xl font-semibold mb-4">{cultoTitulo}</h2>
      <LiveKitRoom serverUrl={roomData.livekitUrl} token={roomData.token} video={true} audio={true}>
        <RoomAudioRenderer />
        <StudioControls cultoId={cultoId} onEnd={() => setEnded(true)} />
      </LiveKitRoom>
    </div>
  )
}
