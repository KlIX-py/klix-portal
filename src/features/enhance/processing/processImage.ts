import { applyCleanup } from './cleanup'
import { applyContrast } from './contrast'
import { applySaturation } from './saturation'
import { applySharpen } from './sharpen'
import type { FastProcessingSettings } from './types'
import { processImageInWorker, supportsFastWorker } from './workerClient'

const outputType = (source: Blob) => ['image/png', 'image/jpeg', 'image/webp'].includes(source.type) ? source.type : 'image/png'

function canvasBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('The browser could not encode the processed image.')), type, type === 'image/jpeg' || type === 'image/webp' ? 0.92 : undefined))
}

async function processImageOnMainThread(source: Blob, settings: FastProcessingSettings): Promise<Blob> {
  const bitmap = await createImageBitmap(source)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width; canvas.height = bitmap.height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('Canvas image processing is not available in this browser.')
    context.drawImage(bitmap, 0, 0)
    const image = context.getImageData(0, 0, canvas.width, canvas.height)
    applyCleanup(image.data, canvas.width, canvas.height, settings.cleanup)
    applyContrast(image.data, settings.contrast)
    applySaturation(image.data, settings.color)
    applySharpen(image.data, canvas.width, canvas.height, settings.sharpen)
    context.putImageData(image, 0, 0)
    return canvasBlob(canvas, outputType(source))
  } finally {
    bitmap.close()
  }
}

export async function processImage(source: Blob, settings: FastProcessingSettings): Promise<Blob> {
  if (supportsFastWorker()) {
    const bitmap = await createImageBitmap(source)
    try {
      return await processImageInWorker(bitmap, settings, outputType(source))
    } catch {
      return processImageOnMainThread(source, settings)
    }
  }
  return processImageOnMainThread(source, settings)
}
