const clampByte = (value: number) => Math.max(0, Math.min(255, value))

export function applySaturation(data: Uint8ClampedArray, strength: number) {
  if (strength === 0) return
  const amount = 1 + (strength / 100) * 0.75
  for (let index = 0; index < data.length; index += 4) {
    const red = data[index]; const green = data[index + 1]; const blue = data[index + 2]
    const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722
    data[index] = clampByte(luminance + (red - luminance) * amount)
    data[index + 1] = clampByte(luminance + (green - luminance) * amount)
    data[index + 2] = clampByte(luminance + (blue - luminance) * amount)
  }
}
