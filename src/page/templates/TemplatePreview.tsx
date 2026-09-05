import { useEffect, useMemo, useRef, useState } from "react"
import {
  DEFAULT_DESKTOP_BACKGROUND,
  DESKTOP_BACKGROUND_FIELD_KEY,
  DESKTOP_CARD_WIDTH,
  PREVIEW_STORAGE_KEY,
  type PreviewSnapshot,
} from "@/lib/template/preview-window"

/**
 * Standalone preview tab opened by the template maker's Preview button — the
 * admin-side twin of the user client's /[locale]/preview route.
 */
export default function TemplatePreview() {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  // Read once on mount: the opener writes the snapshot before calling window.open,
  // so it's already there, and re-reading on every render would just churn.
  const [raw] = useState(() => sessionStorage.getItem(PREVIEW_STORAGE_KEY))

  const state = useMemo<PreviewSnapshot | null>(() => {
    if (!raw) return null
    try {
      return JSON.parse(raw) as PreviewSnapshot
    } catch {
      return null
    }
  }, [raw])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !state) return

    // Mirror the inline editor preview exactly: load the base HTML, then push
    // userData/theme over postMessage so images are set with `el.src = url` (a clean
    // property assignment) instead of being re-parsed out of the srcdoc markup.
    const onLoad = () => {
      iframe.contentWindow?.postMessage({ type: "memoriaUpdate", userData: state.userData, theme: state.theme }, "*")
      iframe.contentWindow?.postMessage({ type: "memoriaGoTo", pageId: state.activePage }, "*")
    }
    iframe.addEventListener("load", onLoad, { once: true })
    iframe.setAttribute("srcdoc", state.html)
    return () => iframe.removeEventListener("load", onLoad)
  }, [state])

  if (!state) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 bg-zinc-900 text-center">
        <p className="text-sm font-medium text-zinc-200">No preview to show</p>
        <p className="text-xs text-zinc-400">Open this tab from the template maker&apos;s Preview button.</p>
      </div>
    )
  }

  // The wallpaper lives out here rather than inside the iframe: the iframe is only
  // as wide as the phone column and can no longer fill the screen behind itself.
  const background = state.userData?.[DESKTOP_BACKGROUND_FIELD_KEY] || DEFAULT_DESKTOP_BACKGROUND

  return (
    <div
      className="h-screen w-screen overflow-hidden bg-zinc-900"
      style={{
        backgroundImage: `url('${background}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <iframe
        ref={iframeRef}
        // allow-popups(-to-escape-sandbox): an embedded map's "Open in Maps" link opens
        // a new tab, and without escaping the sandbox Google refuses to render it.
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        title="Template Preview"
        className="h-full border-0 shadow-2xl"
        style={{ width: `min(${DESKTOP_CARD_WIDTH}px, 100vw)` }}
      />
    </div>
  )
}
