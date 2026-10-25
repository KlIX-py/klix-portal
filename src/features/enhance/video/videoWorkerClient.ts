import type { FastProcessingSettings } from '../processing/types'
import type { VideoValidationStats, VideoWorkerRequest, VideoWorkerResponse } from './videoWorkerTypes'

export class VideoValidationCancelledError extends Error {
  constructor() { super('FAST video validation was cancelled.') }
}

export function startVideoFrameValidation(file: File, settings: FastProcessingSettings, onProgress: (framesProcessed: number, mediaSecondsProcessed: number) => void) {
  const id = `fast-video-${crypto.randomUUID()}`
  const worker = new Worker(new URL('./fastVideo.worker.ts', import.meta.url), { type: 'module' })
  let settled = false
  let rejectRun: (error: Error) => void = () => undefined
  const finish = () => {
    if (settled) return false
    settled = true
    worker.terminate()
    return true
  }
  const promise = new Promise<VideoValidationStats>((resolve, reject) => {
    rejectRun = reject
    worker.onmessage = (event: MessageEvent<VideoWorkerResponse>) => {
      const response = event.data
      if (response.id !== id || settled) return
      if (response.type === 'progress') { onProgress(response.framesProcessed, response.mediaSecondsProcessed); return }
      if (response.type === 'complete') { if (finish()) resolve(response.stats); return }
      if (response.type === 'cancelled') { if (finish()) reject(new VideoValidationCancelledError()); return }
      if (finish()) reject(new Error(response.error))
    }
    worker.onerror = () => {
      if (finish()) reject(new Error('FAST video worker failed to initialize.'))
    }
    const request: VideoWorkerRequest = { type: 'start', id, file, settings }
    worker.postMessage(request)
  })
  return {
    promise,
    cancel() {
      if (settled) return
      worker.postMessage({ type: 'cancel', id } satisfies VideoWorkerRequest)
      setTimeout(() => {
        if (finish()) rejectRun(new VideoValidationCancelledError())
      }, 1000)
    },
  }
}
