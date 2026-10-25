const clampByte = (value: number) => Math.max(0, Math.min(255, value))

export function applyCleanup(data: Uint8ClampedArray, width: number, height: number, strength: number) {
  if (strength <= 0) return
  const source = new Uint8ClampedArray(data)
  const amount = (strength / 100) * 0.24
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = (y * width + x) * 4
      for (let channel = 0; channel < 3; channel += 1) {
        const center = source[index + channel] * 4
        const neighbors = source[index - width * 4 + channel] + source[index + width * 4 + channel] + source[index - 4 + channel] + source[index + 4 + channel]
        const softened = (center + neighbors) / 8
        data[index + channel] = clampByte(source[index + channel] + (softened - source[index + channel]) * amount)
      }
    }
  }
}
