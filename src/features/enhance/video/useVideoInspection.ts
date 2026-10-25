import { useEffect, useRef, useState } from 'react'
import type { MediaAsset } from '../types'
import { inspectVideo } from './inspectVideo'
import type { VideoInspection, VideoInspectionStatus } from './types'

export function useVideoInspection(asset: MediaAsset | null) {
  const [inspection, setInspection] = useState<VideoInspection | null>(null)
  const [status, setStatus] = useState<VideoInspectionStatus>('idle')
  const activeUrl = useRef<string | null>(null)

  useEffect(() => {
    if (!asset || asset.metadata.kind !== 'video') {
      activeUrl.current = null
      setInspection(null)
      setStatus('idle')
      return
    }

    const sourceUrl = asset.url
    activeUrl.current = sourceUrl
    setInspection(null)
    setStatus('loading')
    void inspectVideo(asset.file).then(result => {
      if (activeUrl.current !== sourceUrl) return
      setInspection(result)
      setStatus('ready')
    }).catch(() => {
      if (activeUrl.current !== sourceUrl) return
      setInspection(null)
      setStatus('error')
    })

    return () => {
      if (activeUrl.current === sourceUrl) activeUrl.current = null
    }
  }, [asset?.file, asset?.metadata.kind, asset?.url])

  return { inspection, status }
}
