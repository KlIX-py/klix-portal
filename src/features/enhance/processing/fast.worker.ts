/// <reference lib="webworker" />

import { applyCleanup } from './cleanup'
import { applyContrast } from './contrast'
import { applySaturation } from './saturation'
import { applySharpen } from './sharpen'
import type { FastWorkerRequest, FastWorkerResponse } from './types'

const worker = self as DedicatedWorkerGlobalScope

worker.onmessage = async (event: MessageEvent<FastWorkerRequest>) => {
  const { id, bitmap, settings, outputType } = event.data
  try {
    if (typeof OffscreenCanvas === 'undefined') throw new Error('OffscreenCanvas is not available in this worker.')
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('Canvas image processing is not available in this worker.')
    context.drawImage(bitmap, 0, 0)
    bitmap.close()
    const image = context.getImageData(0, 0, canvas.width, canvas.height)
    applyCleanup(image.data, canvas.width, canvas.height, settings.cleanup)
    applyContrast(image.data, settings.contrast)
    applySaturation(image.data, settings.color)
    applySharpen(image.data, canvas.width, canvas.height, settings.sharpen)
    context.putImageData(image, 0, 0)
    const blob = await canvas.convertToBlob({ type: outputType, quality: outputType === 'image/jpeg' || outputType === 'image/webp' ? 0.92 : undefined })
    const response: FastWorkerResponse = { id, ok: true, blob }
    worker.postMessage(response)
  } catch (error) {
    bitmap.close()
    const response: FastWorkerResponse = { id, ok: false, error: error instanceof Error ? error.message : 'FAST image processing failed in the worker.' }
    worker.postMessage(response)
  }
}
