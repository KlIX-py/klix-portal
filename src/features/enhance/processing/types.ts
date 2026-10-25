export interface FastProcessingSettings {
  cleanup: number
  sharpen: number
  contrast: number
  color: number
}

export interface FastWorkerRequest {
  id: string
  bitmap: ImageBitmap
  settings: FastProcessingSettings
  outputType: string
}

export type FastWorkerResponse =
  | { id: string; ok: true; blob: Blob }
  | { id: string; ok: false; error: string }
