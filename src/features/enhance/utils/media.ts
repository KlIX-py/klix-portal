export const formatBytes = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
export const formatDuration = (seconds?: number) => seconds == null || !Number.isFinite(seconds) ? 'Unavailable' : `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
export const outputDimensions = (width: number, height: number, target: string) => {
  if (target === 'Original') return `${width} × ${height}`
  const longEdge = target === '1080p' ? 1920 : target === '1440p' ? 2560 : 3840
  const landscape = width >= height
  const ratio = width / height
  return landscape ? `${longEdge} × ${Math.round(longEdge / ratio)}` : `${Math.round(longEdge * ratio)} × ${longEdge}`
}
