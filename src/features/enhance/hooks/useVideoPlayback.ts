import { useCallback, useRef, useState } from 'react'

export function useVideoPlayback() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [seeking, setSeeking] = useState(false)

  const togglePlayback = useCallback(async () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) await video.play()
    else video.pause()
  }, [])
  const seek = useCallback((nextTime: number) => {
    const video = videoRef.current
    if (!video) return
    setSeeking(true)
    video.currentTime = nextTime
    setCurrentTime(nextTime)
  }, [])
  const toggleMuted = useCallback(() => setMuted(value => !value), [])

  return {
    videoRef, currentTime, duration, playing, muted, seeking, togglePlayback, seek, toggleMuted,
    onLoadedMetadata: (event: React.SyntheticEvent<HTMLVideoElement>) => setDuration(event.currentTarget.duration),
    onTimeUpdate: (event: React.SyntheticEvent<HTMLVideoElement>) => { setCurrentTime(event.currentTarget.currentTime); setSeeking(false) },
    onPlay: () => setPlaying(true), onPause: () => setPlaying(false), onEnded: () => setPlaying(false),
  }
}
