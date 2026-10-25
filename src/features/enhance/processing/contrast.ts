const clampByte = (value: number) => Math.max(0, Math.min(255, value))

export function applyContrast(data: Uint8ClampedArray, strength: number) {
  if (strength === 0) return
  const factor = 1 + (strength / 100) * 0.65
  for (let index = 0; index < data.length; index += 4) {
    data[index] = clampByte(128 + (data[index] - 128) * factor)
    data[index + 1] = clampByte(128 + (data[index + 1] - 128) * factor)
    data[index + 2] = clampByte(128 + (data[index + 2] - 128) * factor)
  }
}
