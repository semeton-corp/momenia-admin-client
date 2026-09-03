import { useState, useRef, useCallback } from "react"
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { compressImage } from "@/utils/compressImage"

type AspectOption = { label: string; value: number | undefined }

// Cap the crop output at this on the longer side — plenty for a template thumbnail,
// and it keeps the canvas encode + upload fast even for a multi-MB camera photo.
// compressImage() then squeezes it further to fit the upload size budget.
const MAX_OUTPUT_DIMENSION = 1600

function centeredCrop(width: number, height: number, aspect: number | undefined): Crop {
  if (!aspect) {
    return { unit: "%", x: 10, y: 10, width: 80, height: 80 }
  }
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 80 }, aspect, width, height),
    width,
    height
  )
}

async function getCroppedBlob(image: HTMLImageElement, crop: Crop): Promise<Blob> {
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  const cropX = (crop.unit === "%" ? (crop.x / 100) * image.width : crop.x) * scaleX
  const cropY = (crop.unit === "%" ? (crop.y / 100) * image.height : crop.y) * scaleY
  const cropWidth = (crop.unit === "%" ? (crop.width / 100) * image.width : crop.width) * scaleX
  const cropHeight = (crop.unit === "%" ? (crop.height / 100) * image.height : crop.height) * scaleY

  // Downscale during the draw itself — drawing straight from the full-res source into a
  // smaller canvas is far cheaper than encoding at full size and shrinking afterwards.
  const scale = Math.min(1, MAX_OUTPUT_DIMENSION / Math.max(cropWidth, cropHeight))
  const outputWidth = Math.round(cropWidth * scale)
  const outputHeight = Math.round(cropHeight * scale)

  const canvas = document.createElement("canvas")
  canvas.width = outputWidth
  canvas.height = outputHeight
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Failed to get canvas context")

  ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error("Failed to crop image"))
    }, "image/jpeg", 0.9)
  })
}

/**
 * Crop-then-compress step between "user picked a file" and "file goes to
 * onFileSelect". `aspectOptions` should put the field's own target ratio
 * first — it's selected by default, so an uncropped drop still lands on the
 * shape the thumbnail slot expects instead of "Free".
 */
export function ImageCropModal({
  imageSrc,
  fileName,
  aspectOptions,
  onCancel,
  onConfirm,
}: {
  imageSrc: string
  fileName: string
  aspectOptions: AspectOption[]
  onCancel: () => void
  onConfirm: (file: File) => void
}) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [aspect, setAspect] = useState<number | undefined>(aspectOptions[0]?.value)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<Crop>()
  const [isProcessing, setIsProcessing] = useState(false)
  // Set when the browser can't decode the file at all (e.g. HEIC outside Safari).
  // Without this the modal just shows an empty black box with no explanation.
  const [decodeFailed, setDecodeFailed] = useState(false)

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    const initial = centeredCrop(width, height, aspect)
    setCrop(initial)
    setCompletedCrop(initial)
  }, [aspect])

  const handleAspectChange = (value: number | undefined) => {
    setAspect(value)
    if (imgRef.current) {
      const { width, height } = imgRef.current
      const next = centeredCrop(width, height, value)
      setCrop(next)
      setCompletedCrop(next)
    }
  }

  const handleConfirm = async () => {
    if (!imgRef.current || !completedCrop) return
    setIsProcessing(true)
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop)
      const cropped = new File([blob], fileName.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" })
      const compressed = await compressImage(cropped)
      onConfirm(compressed)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Crop Image</h2>
          <button onClick={onCancel} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {aspectOptions.length > 1 && (
          <div className={`flex items-center gap-2 border-b border-border px-5 py-3 ${decodeFailed ? "hidden" : ""}`}>
            {aspectOptions.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => handleAspectChange(opt.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  aspect === opt.value
                    ? "bg-indigo-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {decodeFailed ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
              <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M3 3l18 18" /></svg>
            </div>
            <p className="text-sm font-semibold text-foreground">This image can&apos;t be opened</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Your browser doesn&apos;t support this photo format (often HEIC from an iPhone).
              Convert it to JPG or PNG first, then upload again.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto bg-zinc-900 p-4">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              className="mx-auto"
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt=""
                onLoad={onImageLoad}
                onError={() => setDecodeFailed(true)}
                className="max-h-[60vh] w-auto"
              />
            </ReactCrop>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            {decodeFailed ? "Close" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            hidden={decodeFailed}
            disabled={isProcessing || !completedCrop}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-60"
          >
            {isProcessing ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            )}
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
