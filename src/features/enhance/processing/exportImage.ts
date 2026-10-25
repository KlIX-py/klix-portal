const extensionFor = (type: string) => ({ 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' })[type] ?? 'png'

export function processedFilename(name: string, type: string) {
  const base = name.replace(/\.[^/.]+$/, '') || 'image'
  return `${base}-klix-fast.${extensionFor(type)}`
}

export function saveProcessedImage(blob: Blob, originalName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = processedFilename(originalName, blob.type)
  link.style.display = 'none'
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
