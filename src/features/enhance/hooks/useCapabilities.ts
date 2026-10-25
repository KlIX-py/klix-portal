export const useCapabilities = () => ({
  webGpu: typeof navigator !== 'undefined' && 'gpu' in navigator,
  webCodecs: typeof window !== 'undefined' && 'VideoDecoder' in window,
  workers: typeof Worker !== 'undefined',
  offscreenCanvas: typeof OffscreenCanvas !== 'undefined'
})
