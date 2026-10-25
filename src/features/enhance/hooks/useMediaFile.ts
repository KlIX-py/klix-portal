import { useCallback, useEffect, useRef, useState } from 'react'
import type { MediaAsset, MediaMetadata, MediaStatus } from '../types'

const supportedImage = new Set(['image/png', 'image/jpeg', 'image/webp'])
const supportedVideo = new Set(['video/mp4', 'video/webm', 'video/quicktime'])
const isAllowed = (file: File) => supportedImage.has(file.type) || supportedVideo.has(file.type)

export function useMediaFile() {
  const [asset, setAsset] = useState<MediaAsset | null>(null)
  const [status, setStatus] = useState<MediaStatus>('empty')
  const [error, setError] = useState<string | null>(null)
  const activeUrl = useRef<string | null>(null)
  const processedUrl = useRef<string | null>(null)
  const revokeProcessed = useCallback(() => { if (processedUrl.current) URL.revokeObjectURL(processedUrl.current); processedUrl.current = null }, [])
  const clear = useCallback(() => { revokeProcessed(); if (activeUrl.current) URL.revokeObjectURL(activeUrl.current); activeUrl.current = null; setAsset(null); setStatus('empty'); setError(null) }, [revokeProcessed])
  useEffect(() => () => { revokeProcessed(); if (activeUrl.current) URL.revokeObjectURL(activeUrl.current) }, [revokeProcessed])
  const load = useCallback((file: File) => {
    if (!isAllowed(file)) { setStatus('error'); setError('Choose an MP4, WebM, browser-supported MOV, PNG, JPG, or WebP file.'); return }
    revokeProcessed(); if (activeUrl.current) URL.revokeObjectURL(activeUrl.current)
    const url = URL.createObjectURL(file); activeUrl.current = url; setStatus('loading'); setError(null)
    const kind = file.type.startsWith('video/') ? 'video' : 'image'
    if (kind === 'video') {
      const metadata: MediaMetadata = { name: file.name, bytes: file.size, width: 0, height: 0, type: file.type, kind }
      setAsset({ file, url, metadata }); setStatus('ready')
      return
    }
    const element = new Image()
    const complete = () => {
      const width = element.naturalWidth
      const height = element.naturalHeight
      const duration = undefined
      if (!width || !height) { setStatus('error'); setError('This file could not be decoded by this browser.'); return }
      const metadata: MediaMetadata = { name: file.name, bytes: file.size, width, height, duration, type: file.type, kind }
      setAsset({ file, url, metadata }); setStatus('ready')
    }
    element.addEventListener('load', complete, { once: true })
    element.addEventListener('error', () => { setStatus('error'); setError('This media file could not be read.'); }, { once: true })
    element.src = url
  }, [revokeProcessed])
  const startProcessing = useCallback(() => { setStatus('processing'); setError(null) }, [])
  const finishProcessing = useCallback((sourceUrl: string) => { if (activeUrl.current === sourceUrl) setStatus('ready') }, [])
  const failProcessing = useCallback((sourceUrl: string, message: string) => { if (activeUrl.current === sourceUrl) { setStatus('ready'); setError(message) } }, [])
  const setProcessedOutput = useCallback((blob: Blob, sourceUrl: string) => {
    if (activeUrl.current !== sourceUrl) return false
    revokeProcessed()
    const url = URL.createObjectURL(blob); processedUrl.current = url
    setAsset(current => current?.url === sourceUrl ? { ...current, processedUrl: url, processedBlob: blob } : current)
    return true
  }, [revokeProcessed])
  const updateVideoMetadata = useCallback((sourceUrl: string, width: number, height: number, duration: number) => {
    if (activeUrl.current !== sourceUrl) return
    setAsset(current => current?.url === sourceUrl ? { ...current, metadata: { ...current.metadata, width, height, duration } } : current)
  }, [])
  return { asset, status, error, load, clear, startProcessing, finishProcessing, failProcessing, setProcessedOutput, updateVideoMetadata }
}
