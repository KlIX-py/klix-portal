import type { SyntheticEvent } from 'react'
import type { MediaAsset } from '../types'
import { useVideoPlayback } from '../hooks/useVideoPlayback'
import { formatDuration } from '../utils/media'
import { ComparisonFrame, ComparisonViewer } from './ComparisonViewer'

function VideoComparisonViewer({ asset, onMetadata }: { asset: MediaAsset; onMetadata(sourceUrl: string, width: number, height: number, duration: number): void }) {
  const playback = useVideoPlayback()
  const duration = playback.duration || asset.metadata.duration || 0
  const handleLoadedMetadata = (event: SyntheticEvent<HTMLVideoElement>) => {
    playback.onLoadedMetadata(event)
    const video = event.currentTarget
    onMetadata(asset.url, video.videoWidth, video.videoHeight, video.duration)
  }
  return <div className="preview-wrap"><ComparisonFrame label="SOURCE"><video ref={playback.videoRef} className="native-video" src={asset.url} muted={playback.muted} playsInline onLoadedMetadata={handleLoadedMetadata} onTimeUpdate={playback.onTimeUpdate} onPlay={playback.onPlay} onPause={playback.onPause} onEnded={playback.onEnded} /></ComparisonFrame><div className="video-controls"><button onClick={playback.togglePlayback} aria-label={playback.playing ? 'Pause video' : 'Play video'}>{playback.playing ? 'Ⅱ' : '▶'}</button><span>{formatDuration(playback.currentTime)} / {formatDuration(duration)}</span><input aria-label="Video timeline" type="range" min="0" max={duration || 1} step="0.01" value={playback.currentTime} onChange={event => playback.seek(Number(event.target.value))} /><button onClick={playback.toggleMuted}>{playback.muted ? 'Muted' : 'Sound on'}</button><button onClick={() => playback.videoRef.current?.requestFullscreen()}>Fullscreen</button></div></div>
}

export function MediaPreview({ asset, onVideoMetadata }: { asset: MediaAsset; onVideoMetadata(sourceUrl: string, width: number, height: number, duration: number): void }) {
  if (asset.metadata.kind === 'image') return <div className="preview-wrap"><ComparisonViewer asset={asset} /></div>
  return <VideoComparisonViewer asset={asset} onMetadata={onVideoMetadata} />
}
