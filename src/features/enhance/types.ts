export type MediaStatus = 'empty' | 'loading' | 'ready' | 'error' | 'processing'
export type MediaKind = 'image' | 'video'
export interface MediaMetadata { name: string; bytes: number; width: number; height: number; duration?: number; type: string; kind: MediaKind }
export interface MediaAsset { file: File; url: string; metadata: MediaMetadata; processedUrl?: string }
