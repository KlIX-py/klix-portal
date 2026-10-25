import type { FastProcessingSettings } from '../processing/types'

export interface VideoValidationStats {
  framesProcessed: number
  mediaSecondsProcessed: number
  elapsedMs: number
  averageFrameMs: number
}

export type VideoWorkerRequest =
  | { type: 'start'; id: string; file: File; settings: FastProcessingSettings }
  | { type: 'cancel'; id: string }

export type VideoWorkerResponse =
  | { type: 'progress'; id: string; framesProcessed: number; mediaSecondsProcessed: number }
  | { type: 'complete'; id: string; stats: VideoValidationStats }
  | { type: 'cancelled'; id: string }
  | { type: 'error'; id: string; error: string }
