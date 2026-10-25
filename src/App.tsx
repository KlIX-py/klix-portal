import { useState } from 'react'
import { useCapabilities } from './features/enhance/hooks/useCapabilities'
import { useMediaFile } from './features/enhance/hooks/useMediaFile'
import { processImage } from './features/enhance/processing/processImage'
import { saveProcessedImage } from './features/enhance/processing/exportImage'
import type { FastProcessingSettings } from './features/enhance/processing/types'
import { formatBytes, formatDuration } from './features/enhance/utils/media'
import { Controls } from './features/enhance/components/Controls'
import { MediaDropzone } from './features/enhance/components/MediaDropzone'
import { MediaPreview } from './features/enhance/components/MediaPreview'

const toolCards = [{ title: 'KLIX Enhance', note: 'Local-first video & image preparation', active: true }, { title: 'KLIX Audio', note: 'Shape sound without the detour' }, { title: 'KLIX Beat', note: 'Find rhythm. Mark the moment.' }, { title: 'KLIX AE Tools', note: 'Utilities for expression-heavy work' }]
function CapabilityStatus() { const capabilities = useCapabilities(); return <div className="capabilities"><p className="eyebrow">SYSTEM</p>{Object.entries(capabilities).map(([name, available]) => <div key={name}><span>{name === 'webGpu' ? 'WebGPU' : name === 'webCodecs' ? 'WebCodecs' : name === 'offscreenCanvas' ? 'OffscreenCanvas' : 'Workers'}</span><b className={available ? 'available' : ''}>{available ? 'Available' : 'Unavailable'}</b></div>)}</div> }
function Info({ asset }: { asset: ReturnType<typeof useMediaFile>['asset'] }) { if (!asset) return <div className="info empty-info"><p className="eyebrow">MEDIA INFO</p><p>Metadata appears here after import.</p></div>; const m = asset.metadata; return <div className="info"><p className="eyebrow">MEDIA INFO</p><strong title={m.name}>{m.name}</strong><dl><dt>Dimensions</dt><dd>{m.width} × {m.height}</dd><dt>Aspect ratio</dt><dd>{(m.width / m.height).toFixed(2)}:1</dd><dt>Size</dt><dd>{formatBytes(m.bytes)}</dd><dt>Duration</dt><dd>{m.kind === 'video' ? formatDuration(m.duration) : 'Image'}</dd><dt>MIME type</dt><dd>{m.type}</dd><dt>FPS / Codec</dt><dd>Unavailable</dd></dl></div> }
export default function App() {
  const [view, setView] = useState<'portal' | 'enhance'>('portal'); const media = useMediaFile(); const [message, setMessage] = useState<string | null>(null)
  const openEnhance = () => setView('enhance')
  const enhance = async (mode: string, settings: FastProcessingSettings) => {
    const asset = media.asset
    if (!asset) { setMessage('Select a local image or video before configuring enhancement.'); return }
    if (mode !== 'FAST') { setMessage('This enhancement engine is not implemented yet.'); return }
    if (asset.metadata.kind === 'video') { setMessage('FAST video processing is not implemented yet.'); return }
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
  return <main className="workspace"><header><button className="brand" onClick={() => setView('portal')}><i>k</i> KLIX <span>PORTAL</span></button><div className="crumb">WORKSPACE <b>/</b> <strong>ENHANCE</strong></div><button className="back" onClick={() => setView('portal')}>← All tools</button></header><div className="workspace-grid"><section className="viewer-panel"><div className="viewer-head"><div><p className="eyebrow">KLIX ENHANCE</p><h1>{media.asset ? media.asset.metadata.name : 'Local enhancement workspace'}</h1></div>{media.asset && <button className="secondary compact" onClick={media.clear}>Replace media</button>}</div>{media.status === 'loading' && <div className="loading">Preparing your local preview…</div>}{media.asset ? <MediaPreview asset={media.asset} /> : <MediaDropzone onFile={media.load} error={media.error} />}<div className="status-strip"><span><i className="status-dot" /> {media.status === 'processing' ? 'Processing…' : media.status === 'ready' ? 'Ready for configuration' : 'Local-first workspace'}</span><span>Processing engine: <b>{media.status === 'processing' ? 'FAST local image pipeline' : 'Development stage'}</b></span></div></section><section className="side-panel"><Info asset={media.asset} /><Controls asset={media.asset} processing={media.status === 'processing'} onEnhance={enhance} onExport={exportImage} /><CapabilityStatus /></section></div>{message && <div className="toast" role="status">{message}<button aria-label="Dismiss message" onClick={() => setMessage(null)}>×</button></div>}</main>
}
