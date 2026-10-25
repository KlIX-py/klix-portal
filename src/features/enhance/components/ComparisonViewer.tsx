import type { ReactNode } from 'react'
import type { MediaAsset } from '../types'
import { useComparisonDrag } from '../hooks/useComparisonDrag'

interface FrameProps { children: ReactNode; afterPresentation?: ReactNode; label: string }
export function ComparisonFrame({ children, afterPresentation, label }: FrameProps) {
  const drag = useComparisonDrag()
  return <div ref={drag.containerRef} className="comparison" role="slider" tabIndex={0} aria-label="Before and after comparison position" aria-valuemin={4} aria-valuemax={96} aria-valuenow={drag.accessiblePosition} onPointerDown={drag.onPointerDown} onPointerMove={drag.onPointerMove} onPointerUp={drag.onPointerUp} onKeyDown={drag.onKeyDown}>
    {children}
    {afterPresentation && <div className="after-clip">{afterPresentation}</div>}
    <span className="viewer-label before">BEFORE</span><span className="viewer-label after-label">AFTER · {label}</span><div className="compare-divider" aria-hidden="true"><span>↔</span></div>
  </div>
}

export function ComparisonViewer({ asset }: { asset: MediaAsset }) {
  return <ComparisonFrame label={asset.processedUrl ? 'FAST' : 'SOURCE'} afterPresentation={asset.processedUrl ? <img className="viewer-media" src={asset.processedUrl} alt={`FAST processed preview of ${asset.metadata.name}`} /> : undefined}><img className="viewer-media" src={asset.url} alt={`Preview of ${asset.metadata.name}`} /></ComparisonFrame>
}
