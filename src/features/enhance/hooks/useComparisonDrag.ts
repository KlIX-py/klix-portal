import { useCallback, useEffect, useRef, useState } from 'react'

const clamp = (value: number) => Math.max(4, Math.min(96, value))

export function useComparisonDrag(initialPosition = 54) {
  const containerRef = useRef<HTMLDivElement>(null)
  const position = useRef(initialPosition)
  const frame = useRef<number | null>(null)
  const [accessiblePosition, setAccessiblePosition] = useState(initialPosition)

  const commit = useCallback((clientX: number) => {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    position.current = clamp(((clientX - rect.left) / rect.width) * 100)
    if (frame.current !== null) return
    frame.current = requestAnimationFrame(() => {
      container.style.setProperty('--compare-position', `${position.current}%`)
      frame.current = null
    })
  }, [])

  useEffect(() => () => { if (frame.current !== null) cancelAnimationFrame(frame.current) }, [])

  return {
    containerRef, accessiblePosition,
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => { event.currentTarget.setPointerCapture(event.pointerId); commit(event.clientX) },
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) commit(event.clientX) },
    onPointerUp: () => setAccessiblePosition(position.current),
    onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()
      position.current = clamp(position.current + (event.key === 'ArrowLeft' ? -2 : 2))
      containerRef.current?.style.setProperty('--compare-position', `${position.current}%`)
      setAccessiblePosition(position.current)
    },
  }
}
