import { ALL_FORMATS, BlobSource, canEncodeVideo, Input } from 'mediabunny'
import type { VideoInspection } from './types'

const formatCodec = (codec: string | null) => codec?.toUpperCase() ?? null

export async function inspectVideo(file: File): Promise<VideoInspection> {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS })

  try {
    const [format, tracks, videoTracks, audioTracks, duration] = await Promise.all([
      input.getFormat(),
      input.getTracks(),
      input.getVideoTracks(),
      input.getAudioTracks(),
      input.getDurationFromMetadata(),
    ])
    const primaryVideo = videoTracks[0] ?? null
    const primaryAudio = audioTracks[0] ?? null
    const [videoCodec, audioCodec, width, height, frameRateMetrics, videoDecodeSupported, audioDecodeSupported] = await Promise.all([
      primaryVideo?.getCodec() ?? null,
      primaryAudio?.getCodec() ?? null,
      primaryVideo?.getDisplayWidth() ?? null,
      primaryVideo?.getDisplayHeight() ?? null,
      primaryVideo?.computeFrameRateMetrics().catch(() => null) ?? null,
      primaryVideo?.canDecode().catch(() => false) ?? null,
      primaryAudio ? Promise.all(audioTracks.map(track => track.canDecode().catch(() => false))).then(results => results.every(Boolean)) : null,
    ])
    const futureEncodeTarget = width && height
      ? await canEncodeVideo('avc', { width, height, frameRate: frameRateMetrics?.bestGuessFrameRate }).then(supported => supported ? 'H.264 / MP4' : canEncodeVideo('vp9', { width, height, frameRate: frameRateMetrics?.bestGuessFrameRate }).then(vp9 => vp9 ? 'VP9 / WebM' : null)).catch(() => null)
      : null

    return {
      container: format.name,
      duration,
      width,
      height,
      videoCodec: formatCodec(videoCodec),
      audioCodec: formatCodec(audioCodec),
      frameRate: frameRateMetrics?.bestGuessFrameRate ?? null,
      frameRateIsConstant: frameRateMetrics?.frameRateIsConstant ?? null,
      trackCount: tracks.length,
      hasVideo: videoTracks.length > 0,
      hasAudio: audioTracks.length > 0,
      videoDecodeSupported,
      audioDecodeSupported,
      futureEncodeTarget,
    }
  } finally {
    input[Symbol.dispose]()
  }
}
