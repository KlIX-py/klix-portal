import { useRef, useState } from 'react'
import { useCapabilities } from './features/enhance/hooks/useCapabilities'
import { useMediaFile } from './features/enhance/hooks/useMediaFile'
import { Controls } from './features/enhance/components/Controls'
import { MediaDropzone } from './features/enhance/components/MediaDropzone'
import { MediaPreview } from './features/enhance/components/MediaPreview'
import { saveProcessedImage } from './features/enhance/processing/exportImage'
import { processImage } from './features/enhance/processing/processImage'
import type { FastProcessingSettings } from './features/enhance/processing/types'
import { useVideoInspection } from './features/enhance/video/useVideoInspection'
import type { VideoInspection, VideoInspectionStatus } from './features/enhance/video/types'
import { startVideoFrameValidation, VideoValidationCancelledError } from './features/enhance/video/videoWorkerClient'
import type { VideoValidationStats } from './features/enhance/video/videoWorkerTypes'
import { formatBytes, formatDuration } from './features/enhance/utils/media'

const toolCards = [{ title: 'KLIX Enhance', note: 'Local-first video & image preparation', active: true }, { title: 'KLIX Audio', note: 'Shape sound without the detour' }, { title: 'KLIX Beat', note: 'Find rhythm. Mark the moment.' }, { title: 'KLIX AE Tools', note: 'Utilities for expression-heavy work' }]

function CapabilityStatus() {
  const capabilities = useCapabilities()
  return <div className="capabilities"><p className="eyebrow">SYSTEM</p>{Object.entries(capabilities).map(([name, available]) => <div key={name}><span>{name === 'webGpu' ? 'WebGPU' : name === 'webCodecs' ? 'WebCodecs' : name === 'offscreenCanvas' ? 'OffscreenCanvas' : 'Workers'}</span><b className={available ? 'available' : ''}>{available ? 'Available' : 'Unavailable'}</b></div>)}</div>
}

const unavailable = (value: string | number | null | undefined) => value ?? 'Unavailable'

function Info({ asset, inspection, inspectionStatus }: { asset: ReturnType<typeof useMediaFile>['asset']; inspection: VideoInspection | null; inspectionStatus: VideoInspectionStatus }) {
  if (!asset) return <div className="info empty-info"><p className="eyebrow">MEDIA INFO</p><p>Metadata appears here after import.</p></div>
  const m = asset.metadata
  const isVideo = m.kind === 'video'
  const dimensions = inspection?.width && inspection?.height ? `${inspection.width} × ${inspection.height}` : m.width && m.height ? `${m.width} × ${m.height}` : 'Unavailable'
  const aspectRatio = inspection?.width && inspection?.height ? `${(inspection.width / inspection.height).toFixed(2)}:1` : m.width && m.height ? `${(m.width / m.height).toFixed(2)}:1` : 'Unavailable'
  const fps = inspection?.frameRate ? `${inspection.frameRate.toFixed(2)} FPS${inspection.frameRateIsConstant === false ? ' (variable)' : ''}` : 'Unavailable'
  const codec = inspection?.videoCodec ?? 'Unavailable'
  return <div className="info"><p className="eyebrow">MEDIA INFO</p><strong title={m.name}>{m.name}</strong><dl><dt>Dimensions</dt><dd>{dimensions}</dd><dt>Aspect ratio</dt><dd>{aspectRatio}</dd><dt>Size</dt><dd>{formatBytes(m.bytes)}</dd><dt>Duration</dt><dd>{isVideo ? formatDuration(inspection?.duration ?? m.duration) : 'Image'}</dd><dt>MIME type</dt><dd>{m.type}</dd>{isVideo && <><dt>Container</dt><dd>{inspectionStatus === 'loading' ? 'Inspecting…' : unavailable(inspection?.container)}</dd><dt>FPS / Codec</dt><dd>{inspectionStatus === 'loading' ? 'Inspecting…' : `${fps} / ${codec}`}</dd><dt>Audio codec</dt><dd>{unavailable(inspection?.audioCodec)}</dd><dt>Tracks</dt><dd>{inspection ? `${inspection.trackCount} · ${inspection.hasVideo ? 'Video' : 'No video'} · ${inspection.hasAudio ? 'Audio' : 'No audio'}` : 'Unavailable'}</dd><dt>Decode support</dt><dd>{inspection?.videoDecodeSupported === true ? 'Video supported' : inspection?.videoDecodeSupported === false ? 'Video unavailable' : 'Unavailable'}</dd><dt>Future encode</dt><dd>{unavailable(inspection?.futureEncodeTarget)}</dd></>}</dl>{isVideo && inspection?.videoDecodeSupported === false && <p className="capability-warning" role="status">Preview may play, but this video codec cannot currently be processed by FAST in this browser.</p>}</div>
}

export default function App() {
  const [view, setView] = useState<'portal' | 'enhance'>('portal')
  const media = useMediaFile()
  const { inspection, status: inspectionStatus } = useVideoInspection(media.asset)
  const [message, setMessage] = useState<string | null>(null)
  const [videoProgress, setVideoProgress] = useState<{ framesProcessed: number; mediaSecondsProcessed: number } | null>(null)
  const activeVideoJob = useRef<{ id: number; sourceUrl: string; cancel(): void } | null>(null)
  const nextVideoJobId = useRef(0)
  const openEnhance = () => setView('enhance')
  const cancelVideoValidation = () => {
    const job = activeVideoJob.current
    if (!job) return
    activeVideoJob.current = null
    job.cancel()
    media.finishProcessing(job.sourceUrl)
    setVideoProgress(null)
    setMessage('FAST video validation cancelled.')
  }
  const startVideoValidation = (asset: NonNullable<typeof media.asset>, settings: FastProcessingSettings) => {
    const jobId = nextVideoJobId.current += 1
    const sourceUrl = asset.url
    const job = startVideoFrameValidation(asset.file, settings, (framesProcessed, mediaSecondsProcessed) => {
      if (activeVideoJob.current?.id !== jobId) return
      setVideoProgress({ framesProcessed, mediaSecondsProcessed })
    })
    activeVideoJob.current = { id: jobId, sourceUrl, cancel: job.cancel }
    setVideoProgress({ framesProcessed: 0, mediaSecondsProcessed: 0 })
    media.startProcessing()
    void job.promise.then((stats: VideoValidationStats) => {
      if (activeVideoJob.current?.id !== jobId) return
      activeVideoJob.current = null
      media.finishProcessing(sourceUrl)
      setVideoProgress(null)
      setMessage(`FAST video frame pipeline ready. ${stats.framesProcessed} frames processed successfully. ${stats.mediaSecondsProcessed.toFixed(1)} seconds validated at ${stats.averageFrameMs.toFixed(1)} ms per frame.`)
      console.info('FAST video frame validation complete', stats)
    }).catch(error => {
      if (activeVideoJob.current?.id !== jobId) return
      activeVideoJob.current = null
      media.finishProcessing(sourceUrl)
      setVideoProgress(null)
      if (error instanceof VideoValidationCancelledError) setMessage('FAST video validation cancelled.')
      else setMessage(error instanceof Error ? error.message : 'FAST could not decode this video\'s frames.')
    })
  }
  const loadMedia = (file: File) => { cancelVideoValidation(); media.load(file) }
  const clearMedia = () => { cancelVideoValidation(); media.clear() }
  const leaveEnhance = () => { cancelVideoValidation(); setView('portal') }
  const enhance = async (mode: string, settings: FastProcessingSettings) => {
    const asset = media.asset
    if (!asset) { setMessage('Select a local image or video before configuring enhancement.'); return }
    if (mode !== 'FAST') { setMessage('This enhancement engine is not implemented yet.'); return }
    if (asset.metadata.kind === 'video') {
      if (inspectionStatus === 'idle' || inspectionStatus === 'loading') { setMessage('Video capability inspection is still in progress.'); return }
      if (inspection?.videoDecodeSupported !== true) { setMessage("This video's codec cannot currently be processed by FAST in this browser."); return }
      startVideoValidation(asset, settings)
      return
    }
    const sourceUrl = asset.url
    media.startProcessing()
    try {
      const output = await processImage(asset.file, settings)
      if (media.setProcessedOutput(output, sourceUrl)) setMessage('FAST processing complete at source resolution.')
      media.finishProcessing(sourceUrl)
    } catch {
      media.failProcessing(sourceUrl, 'Image processing failed. The original image remains available.')
      setMessage('Image processing failed. The original image remains available.')
    }
  }
  const exportImage = () => {
    const asset = media.asset
    if (!asset?.processedBlob) return
    saveProcessedImage(asset.processedBlob, asset.metadata.name)
    setMessage('Image ready to save.')
  }
  if (view === 'portal') return <main className="portal"><header><button className="brand" onClick={() => setView('portal')}><i>k</i> KLIX <span>PORTAL</span></button><nav><button>Workspace</button><button>Library</button><button>Learn</button></nav><button className="profile">SP</button></header><section className="hero"><p className="eyebrow">CREATIVE TOOL PLATFORM / 01</p><h1>Tools that stay out<br />of your <em>way.</em></h1><p className="hero-copy">A focused suite for creators who would rather make the edit than manage the process.</p><button className="primary" onClick={openEnhance}>Open KLIX Enhance <span>→</span></button></section><section className="tool-grid">{toolCards.map(card => <article key={card.title} className={`tool-card ${card.active ? 'active' : ''}`}><div className="tool-mark">{card.active ? '✦' : '◌'}</div><p className="eyebrow">{card.active ? 'READY NOW' : 'IN DEVELOPMENT'}</p><h2>{card.title}</h2><p>{card.note}</p><button disabled={!card.active} onClick={openEnhance}>{card.active ? 'Launch →' : 'Coming soon'}</button></article>)}</section><section className="portal-footer"><div><p className="eyebrow">RECENT / PROJECTS</p><h3>Start with a local file.</h3><p>No cloud queue, no upload delay. Your media remains on this device.</p></div><CapabilityStatus /></section></main>
  const processingLabel = videoProgress ? `Testing FAST video pipeline… ${videoProgress.framesProcessed} frames · ${videoProgress.mediaSecondsProcessed.toFixed(1)}s` : undefined
  return <main className="workspace"><header><button className="brand" onClick={leaveEnhance}><i>k</i> KLIX <span>PORTAL</span></button><div className="crumb">WORKSPACE <b>/</b> <strong>ENHANCE</strong></div><button className="back" onClick={leaveEnhance}>← All tools</button></header><div className="workspace-grid"><section className="viewer-panel"><div className="viewer-head"><div><p className="eyebrow">KLIX ENHANCE</p><h1>{media.asset ? media.asset.metadata.name : 'Local enhancement workspace'}</h1></div>{media.asset && <button className="secondary compact" onClick={clearMedia}>Replace media</button>}</div>{media.status === 'loading' && <div className="loading">Preparing your local preview…</div>}{media.asset ? <MediaPreview asset={media.asset} onVideoMetadata={media.updateVideoMetadata} /> : <MediaDropzone onFile={loadMedia} error={media.error} />}<div className="status-strip"><span><i className="status-dot" /> {media.status === 'processing' ? processingLabel ?? 'Processing…' : media.status === 'ready' ? 'Ready for configuration' : 'Local-first workspace'}</span><span>Processing engine: <b>{media.status === 'processing' ? videoProgress ? 'FAST video validation pipeline' : 'FAST local image pipeline' : 'Development stage'}</b></span></div></section><section className="side-panel"><Info asset={media.asset} inspection={inspection} inspectionStatus={inspectionStatus} /><Controls asset={media.asset} processing={media.status === 'processing'} processingLabel={processingLabel} onEnhance={enhance} onExport={exportImage} onCancel={activeVideoJob.current ? cancelVideoValidation : undefined} /><CapabilityStatus /></section></div>{message && <div className="toast" role="status">{message}<button aria-label="Dismiss message" onClick={() => setMessage(null)}>×</button></div>}</main>
}
