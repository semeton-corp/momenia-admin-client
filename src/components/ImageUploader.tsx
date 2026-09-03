import { useRef, useState } from "react"
import { ImageCropModal } from "@/components/ImageCropModal"

type Aspect = "portrait" | "landscape"

// Portrait (mobile thumbnail, 9:16) and landscape (desktop thumbnail, 16:9) both put
// their own field's target ratio first, so it's selected by default in the crop modal —
// dropping a random photo lands on the shape the slot expects instead of "Free".
const ASPECT_OPTIONS: Record<Aspect, { label: string; value: number | undefined }[]> = {
  portrait: [
    { label: "9:16", value: 9 / 16 },
    { label: "Free", value: undefined },
    { label: "1:1", value: 1 },
  ],
  landscape: [
    { label: "16:9", value: 16 / 9 },
    { label: "Free", value: undefined },
    { label: "1:1", value: 1 },
    { label: "4:3", value: 4 / 3 },
  ],
}

/**
 * Drag-and-drop image slot that always routes a picked/dropped file through
 * ImageCropModal before it reaches `onFileSelect` — so every thumbnail is
 * cropped to its slot's aspect and compressed before upload.
 */
export function ImageUploader({ label, previewUrl, uploading, onFileSelect, error, aspect = "landscape" }: { label: string; previewUrl: string; uploading: boolean; onFileSelect: (file: File) => void; error?: string; aspect?: Aspect }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingImage, setPendingImage] = useState<{ src: string; fileName: string } | null>(null)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  // dragenter/dragleave also fire when the pointer crosses a child element (the icon,
  // the text), so the highlight is driven by a depth count rather than the last event seen.
  const dragDepthRef = useRef(0)

  // Portrait constrains width (letting aspect-ratio compute height freely);
  // landscape fills the column width instead. Mixing a width and a height
  // cap on the same box fights the aspect-ratio and produces neither shape.
  const aspectClass = aspect === "portrait" ? "aspect-[9/16] w-full max-w-72 mx-auto" : "aspect-video w-full"

  const openPicker = () => { if (!uploading) inputRef.current?.click() }

  const beginCrop = (file: File) => {
    setPendingImage({ src: URL.createObjectURL(file), fileName: file.name })
  }

  const resetDrag = () => { dragDepthRef.current = 0; setIsDraggingFile(false) }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    if (uploading) return
    dragDepthRef.current += 1
    setIsDraggingFile(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragDepthRef.current -= 1
    if (dragDepthRef.current <= 0) resetDrag()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    resetDrag()
    if (uploading) return
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) beginCrop(file)
  }

  const handleCropCancel = () => {
    if (pendingImage) URL.revokeObjectURL(pendingImage.src)
    setPendingImage(null)
  }

  const handleCropConfirm = (croppedFile: File) => {
    if (pendingImage) URL.revokeObjectURL(pendingImage.src)
    setPendingImage(null)
    onFileSelect(croppedFile)
  }

  return (
    <div className="flex-1">
      <label className="mb-2 block text-sm font-medium text-foreground">{label} <span className="text-destructive">*</span></label>
      <div
        onClick={openPicker}
        onDragEnter={handleDragEnter}
        // Without preventDefault on dragover the browser refuses the drop and opens
        // the image in the tab instead of firing onDrop.
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex ${aspectClass} cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors ${isDraggingFile ? "border-indigo-500 bg-indigo-500/10" : "border-border bg-background hover:border-muted-foreground/50"} ${uploading ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        {previewUrl ? <img src={previewUrl} alt={label} className="absolute inset-0 h-full w-full rounded-xl object-cover" /> : (
          <>
            <svg className={`h-10 w-10 transition-colors ${isDraggingFile ? "text-indigo-400" : "text-muted-foreground/40"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{isDraggingFile ? "Drop to crop & upload" : "Image Banner Empty"}</p>
              {!isDraggingFile && <p className="text-xs text-muted-foreground">Drag &amp; drop, or click to upload a banner file.</p>}
              <p className="text-xs text-muted-foreground">(max size 1 Mb)</p>
            </div>
          </>
        )}
        {isDraggingFile && previewUrl && <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-indigo-500/20 text-sm font-medium text-white">Drop to crop &amp; upload</div>}
        {uploading && <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60"><div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" /></div>}
        {previewUrl && !uploading && !isDraggingFile && <div className="absolute bottom-2 right-2 rounded bg-background/80 px-2 py-1 text-xs text-foreground backdrop-blur-sm">Click to replace</div>}
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" onClick={openPicker} disabled={uploading} className="rounded-lg border border-border px-4 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-60">{uploading ? "Uploading..." : "Upload Files"}</button>
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) beginCrop(file); e.target.value = "" }} />

      {pendingImage && (
        <ImageCropModal
          imageSrc={pendingImage.src}
          fileName={pendingImage.fileName}
          aspectOptions={ASPECT_OPTIONS[aspect]}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  )
}
