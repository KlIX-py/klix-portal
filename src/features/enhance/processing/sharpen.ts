const clampByte = (value: number) => Math.max(0, Math.min(255, value))

export function applySharpen(data: Uint8ClampedArray, width: number, height: number, strength: number) {
  if (strength <= 0) return
  const source = new Uint8ClampedArray(data)
  const amount = (strength / 100) * 0.7
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = (y * width + x) * 4
      for (let channel = 0; channel < 3; channel += 1) {
        const blur = (source[index - width * 4 - 4 + channel] + source[index - width * 4 + channel] * 2 + source[index - width * 4 + 4 + channel] + source[index - 4 + channel] * 2 + source[index + channel] * 4 + source[index + 4 + channel] * 2 + source[index + width * 4 - 4 + channel] + source[index + width * 4 + channel] * 2 + source[index + width * 4 + 4 + channel]) / 16
        data[index + channel] = clampByte(source[index + channel] + (source[index + channel] - blur) * amount)
      }
    }
  }
}
