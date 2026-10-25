import type { FastProcessingSettings, FastWorkerResponse } from './types'

type PendingJob = { resolve(blob: Blob): void; reject(error: Error): void }

let worker: Worker | null = null
let nextId = 0
const pending = new Map<string, PendingJob>()

function rejectPending(error: Error) {
  pending.forEach(job => job.reject(error))
  pending.clear()
}

function getWorker() {
  if (worker) return worker
  const instance = new Worker(new URL('./fast.worker.ts', import.meta.url), { type: 'module' })
  instance.onmessage = (event: MessageEvent<FastWorkerResponse>) => {
    const response = event.data
    const job = pending.get(response.id)
    if (!job) return
    pending.delete(response.id)
    if (response.ok) job.resolve(response.blob)
    else job.reject(new Error(response.error))
  }
  instance.onerror = () => {
    rejectPending(new Error('FAST image worker failed to initialize.'))
    instance.terminate()
    if (worker === instance) worker = null
  }
  worker = instance
  return instance
}

export function supportsFastWorker() {
  return typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap !== 'undefined'
}

export function processImageInWorker(bitmap: ImageBitmap, settings: FastProcessingSettings, outputType: string): Promise<Blob> {
  const id = `fast-${nextId += 1}`
  return new Promise((resolve, reject) => {
    const instance = getWorker()
    pending.set(id, { resolve, reject })
    try {
      instance.postMessage({ id, bitmap, settings, outputType }, [bitmap])
    } catch (error) {
      pending.delete(id)
      bitmap.close()
      reject(error instanceof Error ? error : new Error('FAST image worker could not accept the source image.'))
    }
  })
}
