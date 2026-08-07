export type CompressImageOptions = {
  /** Upper bound on width/height in pixels — images are only ever scaled down. */
  maxWidth?: number
  maxHeight?: number
  /** Desired output size in bytes. Quality is searched to land just under this. */
  targetSizeBytes?: number
  /** Floor for the JPEG quality search — below this we shrink dimensions instead. */
  minQuality?: number
}

/**
 * Downscales and re-encodes an image on the canvas before upload, so a
 * multi-MB phone photo doesn't get shipped to S3 (and back down to every
 * visitor's browser) at full resolution.
 *
 * Rather than a fixed JPEG quality (which either over- or under-compresses
 * depending on the source), this binary-searches for the highest quality
 * that still lands under `targetSizeBytes`. If even the quality floor can't
 * hit the target at the current resolution, it shrinks the dimensions and
 * tries again.
 */
export async function compressImage(
  file: File,
  { maxWidth = 1920, maxHeight = 1920, targetSizeBytes = 1024 * 1024, minQuality = 0.5 }: CompressImageOptions = {},
): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file
  }

  const bitmap = await createImageBitmap(file)
  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg"

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    bitmap.close()
    return file
  }

  const renderAt = (width: number, height: number) => {
    canvas.width = width
    canvas.height = height
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(bitmap, 0, 0, width, height)
  }

  const toBlob = (quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outputType, quality))

  let scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height)
  let best: Blob | null = null

  for (let attempt = 0; attempt < 4; attempt++) {
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    renderAt(width, height)

    // PNG's "quality" argument is ignored by most browsers — nothing to
    // search, just take the downscaled result.
    if (outputType !== "image/jpeg") {
      best = await toBlob(1)
      break
    }

    const atMinQuality = await toBlob(minQuality)
    if (!atMinQuality) break

    if (atMinQuality.size > targetSizeBytes) {
      // Even the lowest acceptable quality overshoots at this resolution —
      // keep it as a fallback and shrink further before giving up.
      if (!best || atMinQuality.size < best.size) best = atMinQuality
      scale *= 0.75
      continue
    }

    // minQuality already fits the budget — search upward for the highest
    // quality that still stays under it.
    let lo = minQuality
    let hi = 0.95
    let found = atMinQuality
    for (let i = 0; i < 5; i++) {
      const mid = (lo + hi) / 2
      const candidate = await toBlob(mid)
      if (!candidate) break
      if (candidate.size <= targetSizeBytes) {
        found = candidate
        lo = mid
      } else {
        hi = mid
      }
    }
    best = found
    break
  }

  bitmap.close()

  if (!best || best.size >= file.size) return file

  const newName = file.name.replace(/\.\w+$/, outputType === "image/png" ? ".png" : ".jpg")
  return new File([best], newName, { type: outputType, lastModified: Date.now() })
}
