import { useRef, useState } from 'react'

interface Props { onFile(file: File): void; error?: string | null }
export function MediaDropzone({ onFile, error }: Props) {
  const input = useRef<HTMLInputElement>(null); const [dragging, setDragging] = useState(false)
  return <section className={`dropzone ${dragging ? 'dragging' : ''}`} onDragOver={event => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file) onFile(file) }}>
    <div className="drop-icon">↥</div><p className="eyebrow">LOCAL MEDIA</p><h2>Drop a file to begin</h2><p className="muted">Nothing leaves this browser. MP4, WebM, MOV, PNG, JPG, or WebP.</p>
    <button className="secondary" onClick={() => input.current?.click()}>Browse files</button><input ref={input} className="sr-only" type="file" accept="video/mp4,video/webm,video/quicktime,image/png,image/jpeg,image/webp" onChange={event => { const file = event.target.files?.[0]; if (file) onFile(file); event.currentTarget.value = '' }} />
    {error && <p className="error" role="alert">{error}</p>}
  </section>
}
