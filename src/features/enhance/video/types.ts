export type VideoInspectionStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface VideoInspection {
  container: string
  duration: number | null
  width: number | null
  height: number | null
  videoCodec: string | null
  audioCodec: string | null
  frameRate: number | null
  frameRateIsConstant: boolean | null
  trackCount: number
  hasVideo: boolean
  hasAudio: boolean
  videoDecodeSupported: boolean | null
  audioDecodeSupported: boolean | null
  futureEncodeTarget: string | null
}
