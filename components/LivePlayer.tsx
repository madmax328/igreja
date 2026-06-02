'use client'
import { useEffect, useState } from 'react'
import { LiveKitRoom, VideoConference } from '@livekit/components-react'
import '@livekit/components-styles'

interface LivePlayerProps {
  roomName: string
}

export default function LivePlayer({ roomName }: LivePlayerProps) {
  const [token, setToken] = useState<string | null>(null)
  const [wsUrl, setWsUrl] = useState<string>('')

  useEffect(() => {
    fetch(`/api/live/viewer-token?room=${roomName}`)
      .then(r => r.json())
      .then(data => {
        setToken(data.token)
        setWsUrl(data.livekitUrl)
      })
  }, [roomName])

  if (!token) {
    return (
      <div className="flex items-center justify-center h-96 bg-zinc-900 rounded-xl">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">A conectar à live...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[600px] rounded-xl overflow-hidden">
      <LiveKitRoom serverUrl={wsUrl} token={token} video={false} audio={false}>
        <VideoConference />
      </LiveKitRoom>
    </div>
  )
}
