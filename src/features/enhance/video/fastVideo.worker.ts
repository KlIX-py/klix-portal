/// <reference lib="webworker" />

import { ALL_FORMATS, BlobSource, Input, VideoSampleSink } from 'mediabunny'
import { applyCleanup } from '../processing/cleanup'
import { applyContrast } from '../processing/contrast'
import { applySaturation } from '../processing/saturation'
import { applySharpen } from '../processing/sharpen'
import type { FastProcessingSettings } from '../processing/types'
import type { VideoWorkerRequest, VideoWorkerResponse } from './videoWorkerTypes'

const worker = self as DedicatedWorkerGlobalScope
const validationDurationSeconds = 3
const maxValidationFrames = 120
const progressIntervalMs = 125
const cancelledJobs = new Set<string>()

const post = (response: VideoWorkerResponse) => worker.postMessage(response)
const yieldToMessages = () => new Promise<void>(resolve => setTimeout(resolve, 0))

async function runValidation(id: string, file: File, settings: FastProcessingSettings) {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS })
  let canvas: OffscreenCanvas | null = null
  let context: OffscreenCanvasRenderingContext2D | null = null
  let currentTimestamp = 0
  let framesProcessed = 0
  let mediaSecondsProcessed = 0
  let lastProgressAt = 0
  const startedAt = performance.now()

  try {
    const [track, duration] = await Promise.all([input.getPrimaryVideoTrack(), input.getDurationFromMetadata()])
    if (!track) throw new Error('FAST could not decode this video\'s frames because no video track was found.')
    const targetDuration = duration && duration > 0 ? Math.min(duration, validationDurationSeconds) : validationDurationSeconds
    const sink = new VideoSampleSink(track, { optimizeForLatency: true })

    for await (const sample of sink.samples(0, targetDuration)) {
      try {
        if (cancelledJobs.has(id)) break
        currentTimestamp = sample.timestamp
        if (!canvas || canvas.width !== sample.displayWidth || canvas.height !== sample.displayHeight) {
          canvas = new OffscreenCanvas(sample.displayWidth, sample.displayHeight)
          const canvasContext = canvas.getContext('2d', { willReadFrequently: true })
          if (!canvasContext) throw new Error('FAST video frame processing needs an OffscreenCanvas 2D context.')
          context = canvasContext
        }
        if (!context) throw new Error('FAST video frame processing needs an OffscreenCanvas 2D context.')
        sample.draw(context, 0, 0, canvas.width, canvas.height)
        const image = context.getImageData(0, 0, canvas.width, canvas.height)
        applyCleanup(image.data, canvas.width, canvas.height, settings.cleanup)
        applyContrast(image.data, settings.contrast)
        applySaturation(image.data, settings.color)
        applySharpen(image.data, canvas.width, canvas.height, settings.sharpen)
        context.putImageData(image, 0, 0)

        framesProcessed += 1
        mediaSecondsProcessed = Math.min(targetDuration, Math.max(mediaSecondsProcessed, sample.timestamp + sample.duration))
        const now = performance.now()
        if (now - lastProgressAt >= progressIntervalMs) {
          post({ type: 'progress', id, framesProcessed, mediaSecondsProcessed })
          lastProgressAt = now
        }
        if (framesProcessed >= maxValidationFrames) break
        await yieldToMessages()
      } finally {
        sample.close()
      }
    }

    if (cancelledJobs.has(id)) {
      post({ type: 'cancelled', id })
      return
    }
    if (!framesProcessed) throw new Error('No decodable video frames were available in the validation segment.')
    const elapsedMs = performance.now() - startedAt
    post({ type: 'complete', id, stats: { framesProcessed, mediaSecondsProcessed, elapsedMs, averageFrameMs: framesProcessed ? elapsedMs / framesProcessed : 0 } })
  } catch (error) {
    const prefix = currentTimestamp > 0 ? `FAST frame processing failed at ${currentTimestamp.toFixed(1)} seconds.` : 'FAST could not decode this video\'s frames.'
    const detail = error instanceof Error ? error.message : ''
    post({ type: 'error', id, error: detail ? `${prefix} ${detail}` : prefix })
  } finally {
    cancelledJobs.delete(id)
    input[Symbol.dispose]()
  }
}

worker.onmessage = (event: MessageEvent<VideoWorkerRequest>) => {
  if (event.data.type === 'cancel') {
    cancelledJobs.add(event.data.id)
    return
  }
  void runValidation(event.data.id, event.data.file, event.data.settings)
}
