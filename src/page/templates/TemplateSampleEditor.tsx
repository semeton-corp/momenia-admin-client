import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { GripVertical } from "lucide-react"
import { renderInvitation, renderPreviewError } from "@/lib/template/renderer"
import { DEFAULT_DESKTOP_BACKGROUND, DESKTOP_BACKGROUND_FIELD_KEY, DESKTOP_CARD_WIDTH } from "@/lib/template/preview-window"
import { SAMPLE_EDITOR_STORAGE_PREFIX, type TemplateSampleSnapshot } from "@/lib/template/sample-editor-window"
import type { FieldSchema, Invitation, SectionConfig, Theme } from "@/lib/template/types"

const FONT_OPTIONS = ["Inter", "Playfair Display", "Montserrat", "Lora", "Cormorant Garamond", "Great Vibes", "Arial", "Georgia"]
const LAPTOP_FRAME_W = 3744
const LAPTOP_FRAME_H = 2126
const LAPTOP_MOCKUP_W = 1800
const LAPTOP_MOCKUP_H = Math.round(LAPTOP_MOCKUP_W * LAPTOP_FRAME_H / LAPTOP_FRAME_W)
const LAPTOP_SCREEN_INSET = { left: "13.1%", right: "12.6%", top: "2%", bottom: "10%" }

function readSnapshot(sessionId: string | null): TemplateSampleSnapshot | null {
  if (!sessionId) return null
  try {
    const raw = sessionStorage.getItem(`${SAMPLE_EDITOR_STORAGE_PREFIX}${sessionId}`)
    return raw ? (JSON.parse(raw) as TemplateSampleSnapshot) : null
  } catch { return null }
}

function Icon({ children }: { children: React.ReactNode }) {
  return <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">{children}</span>
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white"><div className="border-b border-zinc-100 px-5 py-4"><h2 className="text-lg font-bold text-zinc-900">{title}</h2>{subtitle && <p className="mt-0.5 text-sm text-zinc-400">{subtitle}</p>}</div><div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div></aside>
}

function SectionCard({ title, icon, children, defaultOpen = true, onOpen }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; onOpen?: () => void }) {
  const [open, setOpen] = useState(defaultOpen)
  return <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white"><button onClick={() => { if (!open) onOpen?.(); setOpen((value) => !value) }} className="flex w-full items-center gap-3 px-3.5 py-3 text-left">{icon}<span className="flex-1 text-sm font-semibold text-zinc-700">{title}</span><span className="text-zinc-400">{open ? "⌄" : "›"}</span></button>{open && <div className="border-t border-zinc-100 px-3.5 py-3">{children}</div>}</section>
}

function ContentSectionList({ order, sections, onMove, onReorder }: { order: string[]; sections: SectionConfig[]; onMove: (index: number, direction: -1 | 1) => void; onReorder: (from: number, to: number) => void }) {
  const dragIndexRef = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const resetDrag = () => { dragIndexRef.current = null; setDragOverIndex(null); setDraggingIndex(null) }
  const sectionLabel = (id: string) => {
    const type = sections.find((section) => section.id === id)?.section_type_id ?? id
    return type.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
  }

  return <div className="space-y-2">
    <p className="text-xs text-zinc-400">Drag and drop to reorder sections</p>
    {order.map((id, index) => {
      const label = sectionLabel(id)
      const isTarget = dragOverIndex === index && draggingIndex !== index
      return <div key={id} className="relative">
        {isTarget && <div aria-hidden="true" className={`pointer-events-none absolute left-0 right-0 z-10 h-1 rounded bg-indigo-500 ${draggingIndex !== null && draggingIndex < index ? "-bottom-1" : "-top-1"}`} />}
        <div
          draggable
          onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", id); dragIndexRef.current = index; setDraggingIndex(index) }}
          onDragOver={(event) => { if (dragIndexRef.current === null) return; event.preventDefault(); event.dataTransfer.dropEffect = "move"; if (dragOverIndex !== index) setDragOverIndex(index) }}
          onDrop={(event) => { event.preventDefault(); const from = dragIndexRef.current; if (from !== null && from !== index) onReorder(from, index); resetDrag() }}
          onDragEnd={resetDrag}
          onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragOverIndex(null) }}
          className={`flex cursor-grab items-center gap-2 rounded-xl border px-2.5 py-2 text-sm transition-colors active:cursor-grabbing ${draggingIndex === index ? "border-indigo-300 bg-indigo-50 opacity-60" : "border-zinc-200 bg-white hover:bg-zinc-50"}`}
          title={id}
        >
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-700">{label}</span>
          <GripVertical aria-hidden="true" className="h-4 w-4 shrink-0 text-zinc-400" />
          <button type="button" aria-label={`Move ${label} up`} disabled={index === 0} onClick={() => onMove(index, -1)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-zinc-500 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:opacity-30">↑</button>
          <button type="button" aria-label={`Move ${label} down`} disabled={index === order.length - 1} onClick={() => onMove(index, 1)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-zinc-500 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:opacity-30">↓</button>
        </div>
      </div>
    })}
  </div>
}

function TemporarySampleImageControl({ field, value, onChange }: { field: FieldSchema; value: string; onChange: (value: string) => void }) {
  const [urlInput, setUrlInput] = useState(() => value.startsWith("data:") ? "" : value)
  const [fileName, setFileName] = useState<string | null>(value.startsWith("data:") ? "Temporary local preview" : null)
  const [error, setError] = useState<string | null>(null)
  const [previewFailed, setPreviewFailed] = useState(false)
  const className = "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
  const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

  useEffect(() => {
    if (!value.startsWith("data:")) {
      setUrlInput(value)
      setFileName(null)
    }
    setPreviewFailed(false)
  }, [value])

  return <div className="space-y-2">
    <input value={urlInput} onChange={(event) => { const next = event.target.value; setUrlInput(next); setFileName(null); setError(null); onChange(next) }} type="url" placeholder={field.placeholder || "Paste a public image URL"} className={className} />
    <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-3 py-2.5">
      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="block w-full text-xs text-zinc-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-xs file:font-medium file:text-indigo-700" onChange={(event) => {
        const file = event.target.files?.[0]
        if (!file) return
        if (!supportedTypes.has(file.type)) {
          setError("HEIC/HEIF cannot be previewed in this temporary editor. Choose JPG, PNG, WebP, or GIF, or paste an image URL.")
          event.currentTarget.value = ""
          return
        }
        const reader = new FileReader()
        reader.onload = () => {
          if (typeof reader.result !== "string") return
          setUrlInput("")
          setFileName(file.name)
          setError(null)
          onChange(reader.result)
        }
        reader.readAsDataURL(file)
      }} />
      <p className="mt-1.5 text-[11px] leading-4 text-zinc-400">Temporary preview only — this file is not uploaded or saved. JPG, PNG, WebP, and GIF are supported.</p>
      {fileName && <p className="mt-1 text-[11px] font-medium text-indigo-600">Using: {fileName}</p>}
      {error && <p className="mt-1 text-[11px] leading-4 text-rose-600">{error}</p>}
    </div>
    {value && !previewFailed && <img src={value} onError={() => setPreviewFailed(true)} alt="Sample preview" className="max-h-32 w-full rounded-xl border border-zinc-200 object-contain" />}
    {value && previewFailed && <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">Preview unavailable. Paste a public direct image URL or choose JPG, PNG, WebP, or GIF.</p>}
  </div>
}

function FieldControl({ field, value, onChange }: { field: FieldSchema; value: string; onChange: (value: string) => void }) {
  const className = "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
  const common = { value, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value), placeholder: field.placeholder ?? "", className }
  if (field.type === "textarea") return <textarea {...common} rows={3} />
  if (field.type === "select") return <select value={value} onChange={(event) => onChange(event.target.value)} className={className}><option value="">{field.placeholder || "Choose one"}</option>{(field.options ?? []).filter(Boolean).map((option) => <option key={option} value={option}>{option}</option>)}</select>
  if (field.type === "image") return <TemporarySampleImageControl field={field} value={value} onChange={onChange} />
  if (field.type === "color") return <input type="color" value={value || "#000000"} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-zinc-200 bg-white p-1" />
  if (field.type === "date") {
    // Match the user editor's rule: today is valid, earlier local dates are not.
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    return <input {...common} type="date" min={today} onChange={(event) => { const next = event.target.value; if (!next || next >= today) onChange(next) }} />
  }
  return <input {...common} type={field.type === "time" ? "time" : "text"} />
}

function PreviewFrame({ html, page, userData, theme, scrollRequest, onPageChange, device }: { html: string; page: string; userData: Invitation["userData"]; theme: Theme; scrollRequest: { sectionId: string } | null; onPageChange: (page: string) => void; device: "mobile" | "desktop" }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const loadedRef = useRef(false)
  const pageRef = useRef(page)
  const previewDataRef = useRef({ userData, theme })
  const scrollRequestRef = useRef(scrollRequest)
  const sentDataRef = useRef(userData)
  const sentThemeRef = useRef(theme)
  useEffect(() => { scrollRequestRef.current = scrollRequest }, [scrollRequest])
  useEffect(() => { const handler = (event: MessageEvent) => { if (loadedRef.current && event.source === iframeRef.current?.contentWindow && event.data?.type === "memoriaPageChange" && typeof event.data.pageId === "string") onPageChange(event.data.pageId) }; window.addEventListener("message", handler); return () => window.removeEventListener("message", handler) }, [onPageChange])
  useEffect(() => {
    previewDataRef.current = { userData, theme }
    const changedData = Object.fromEntries(Object.entries(userData).filter(([key, value]) => sentDataRef.current[key] !== value))
    const themeChanged = sentThemeRef.current !== theme
    sentDataRef.current = userData
    sentThemeRef.current = theme
    if (loadedRef.current && (Object.keys(changedData).length || themeChanged)) {
      iframeRef.current?.contentWindow?.postMessage({ type: "memoriaUpdate", userData: changedData, ...(themeChanged ? { theme } : {}) }, "*")
    }
  }, [userData, theme])
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !html) return
    loadedRef.current = false
    const onReady = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow || event.data?.type !== "memoriaReady" || loadedRef.current) return
      loadedRef.current = true
      iframe.contentWindow?.postMessage({ type: "memoriaUpdate", ...previewDataRef.current }, "*")
      iframe.contentWindow?.postMessage({ type: "memoriaGoTo", pageId: pageRef.current }, "*")
      if (scrollRequestRef.current) iframe.contentWindow?.postMessage({ type: "memoriaScrollToSection", sectionId: scrollRequestRef.current.sectionId }, "*")
    }
    window.addEventListener("message", onReady)
    iframe.setAttribute("srcdoc", html)
    return () => window.removeEventListener("message", onReady)
  }, [html])
  useEffect(() => { pageRef.current = page; if (loadedRef.current) iframeRef.current?.contentWindow?.postMessage({ type: "memoriaGoTo", pageId: page }, "*") }, [page])
  useEffect(() => { if (loadedRef.current && scrollRequest) iframeRef.current?.contentWindow?.postMessage({ type: "memoriaScrollToSection", sectionId: scrollRequest.sectionId }, "*") }, [scrollRequest])
  return <iframe ref={iframeRef} sandbox="allow-scripts" title="Sample invitation preview" className={device === "desktop" ? "block h-full shrink-0 border-0 shadow-2xl" : "block h-[812px] w-[375px] border-0"} style={device === "desktop" ? { width: `min(${DESKTOP_CARD_WIDTH}px, 100%)` } : undefined} />
}

export default function TemplateSampleEditor() {
  const [searchParams] = useSearchParams()
  const [snapshot] = useState(() => readSnapshot(searchParams.get("session")))
  const [invitation, setInvitation] = useState<Invitation | null>(() => snapshot?.invitation ?? null)
  const [page, setPage] = useState(() => snapshot?.template.pages[0]?.id ?? "cover")
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile")
  const [mobileZoom, setMobileZoom] = useState(0.82)
  const [desktopZoom, setDesktopZoom] = useState(0.6)
  const [scrollRequest, setScrollRequest] = useState<{ sectionId: string } | null>(null)
  const fields = useMemo(() => snapshot?.template.schema.fields ?? [], [snapshot])
  const activePage = useMemo(() => snapshot?.template.pages.find((item) => item.id === page), [snapshot, page])
  const sectionOrder = invitation?.sectionOrder
  const orderedPageSections = useMemo(() => {
    const sections = activePage?.sections ?? []
    if (activePage?.id !== "main") return sections
    return (sectionOrder ?? []).map((id) => sections.find((section) => section.id === id)).filter((section): section is (typeof sections)[number] => Boolean(section))
  }, [activePage, sectionOrder])
  const activeSectionIds = useMemo(() => new Set(orderedPageSections.flatMap((section) => [section.id, section.section_type_id])), [orderedPageSections])
  // A page can reuse values that are managed by another section. For example, the
  // Bleu Jardin cover displays bride_name/groom_name/event_date even though those
  // controls belong to the couple/event sections on the Main page. Include every
  // schema key interpolated by this page so authors can test the actual cover.
  const activePageFieldKeys = useMemo(() => {
    const keys = new Set<string>()
    orderedPageSections.forEach((section) => {
      const html = snapshot?.sectionTypes[section.section_type_id]?.html ?? ""
      for (const match of html.matchAll(/\{\{\s*([^}\s]+)\s*\}\}/g)) keys.add(match[1])
    })
    return keys
  }, [orderedPageSections, snapshot])
  const fieldGroups = useMemo(() => { const groups = new Map<string, FieldSchema[]>(); fields.filter((field) => field.key !== DESKTOP_BACKGROUND_FIELD_KEY).forEach((field) => groups.set(field.section, [...(groups.get(field.section) ?? []), field])); return Array.from(groups.entries()) }, [fields])
  const orderedFieldGroups = useMemo(() => {
    const sectionSources = orderedPageSections.map((section) => snapshot?.sectionTypes[section.section_type_id]?.html ?? "")
    const position = ([section, group]: [string, FieldSchema[]]) => {
      const ownIndex = orderedPageSections.findIndex((item) => item.id === section || item.section_type_id === section)
      if (ownIndex >= 0) return [ownIndex, -1]
      for (let index = 0; index < sectionSources.length; index++) {
        const offsets = group.map((field) => sectionSources[index].indexOf(`{{${field.key}}}`)).filter((offset) => offset >= 0)
        if (offsets.length) return [index, Math.min(...offsets)]
      }
      return [Number.MAX_SAFE_INTEGER, 0]
    }
    return fieldGroups
      .filter(([section, group]) => activeSectionIds.has(section) || group.some((field) => activePageFieldKeys.has(field.key)))
      .sort((left, right) => {
        const a = position(left)
        const b = position(right)
        return a[0] - b[0] || a[1] - b[1]
      })
  }, [fieldGroups, orderedPageSections, snapshot, activeSectionIds, activePageFieldKeys])
  const desktopBackgroundField = fields.find((field) => field.key === DESKTOP_BACKGROUND_FIELD_KEY)
  const html = useMemo(() => {
    if (!snapshot || !sectionOrder) return ""
    try { return renderInvitation(snapshot.template, { ...snapshot.invitation, sectionOrder }, snapshot.sectionTypes) } catch (error) { return renderPreviewError(error) }
  }, [snapshot, sectionOrder])

  if (!snapshot || !invitation) return <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-center text-zinc-300"><div><p className="font-semibold">Sample editor unavailable</p><p className="mt-2 text-sm text-zinc-500">Open it from a template’s Edit Sample Content button.</p></div></main>

  const changeValue = (key: string, value: string) => setInvitation((current) => current ? { ...current, userData: { ...current.userData, [key]: value } } : current)
  const changeTheme = (key: keyof Theme, value: string) => setInvitation((current) => current ? { ...current, theme: { ...current.theme, [key]: value } } : current)
  const moveSection = (index: number, direction: -1 | 1) => setInvitation((current) => { if (!current) return current; const destination = index + direction; if (destination < 0 || destination >= current.sectionOrder.length) return current; const sectionOrder = [...current.sectionOrder]; [sectionOrder[index], sectionOrder[destination]] = [sectionOrder[destination], sectionOrder[index]]; return { ...current, sectionOrder } })
  const reorderSection = (from: number, to: number) => setInvitation((current) => {
    if (!current || from === to || from < 0 || to < 0 || from >= current.sectionOrder.length || to >= current.sectionOrder.length) return current
    const sectionOrder = [...current.sectionOrder]
    const [moved] = sectionOrder.splice(from, 1)
    sectionOrder.splice(to, 0, moved)
    return { ...current, sectionOrder }
  })
  const wallpaper = invitation.userData[DESKTOP_BACKGROUND_FIELD_KEY] || DEFAULT_DESKTOP_BACKGROUND
  const zoom = device === "desktop" ? desktopZoom : mobileZoom
  const setZoom = device === "desktop" ? setDesktopZoom : setMobileZoom
  const titleFontOptions = Array.from(new Set([invitation.theme.font_title, ...FONT_OPTIONS]))
  const bodyFontOptions = Array.from(new Set([invitation.theme.font_body, ...FONT_OPTIONS]))
  const frameWidth = 391 * zoom
  const frameHeight = 828 * zoom
  const scrollToField = (field: FieldSchema) => {
    const sections = orderedPageSections
    const ownSection = sections.find((section) => section.section_type_id === field.section || section.id === field.section)
    const matchingSection = ownSection ?? sections.find((section) => {
      const source = snapshot.sectionTypes[section.section_type_id]?.html ?? ""
      return Array.from(source.matchAll(/\{\{\s*([^}\s]+)\s*\}\}/g)).some((match) => match[1] === field.key)
    })
    if (matchingSection) setScrollRequest({ sectionId: matchingSection.id })
  }
  const scrollToGroup = (sectionTypeId: string, group: FieldSchema[]) => {
    const ownSection = orderedPageSections.find((section) => section.section_type_id === sectionTypeId || section.id === sectionTypeId)
    if (ownSection) setScrollRequest({ sectionId: ownSection.id })
    else if (group[0]) scrollToField(group[0])
  }

  return <main className="flex h-screen min-w-[980px] flex-col overflow-hidden bg-zinc-50 text-zinc-900">
    <header className="flex h-[74px] shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-7"><div><h1 className="text-xl font-bold tracking-tight">{snapshot.template.name || "Sample invitation"}</h1><p className="mt-0.5 text-xs text-zinc-400"><span className="mr-1 text-emerald-500">●</span>Sample mode — changes are discarded when this tab closes</p></div><div className="absolute left-1/2 flex -translate-x-1/2 rounded-lg bg-indigo-100 p-1"><button onClick={() => setDevice("mobile")} className={`rounded-md px-4 py-2 text-sm font-medium ${device === "mobile" ? "bg-white text-indigo-700 shadow-sm" : "text-indigo-500"}`}>▯&nbsp; Mobile</button><button onClick={() => setDevice("desktop")} className={`rounded-md px-4 py-2 text-sm font-medium ${device === "desktop" ? "bg-white text-indigo-700 shadow-sm" : "text-indigo-500"}`}>▣&nbsp; Desktop</button></div><button onClick={() => window.close()} className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50">Close</button></header>
    <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(440px,1fr)_340px] gap-4 p-4">
      <Panel title="Design" subtitle="Customize the look and feel"><div className="space-y-3">
        <SectionCard title="Typography" icon={<Icon>Ｔ</Icon>}><div className="space-y-3"><label className="block text-xs font-medium text-zinc-500">Heading Font<select value={invitation.theme.font_title} onChange={(event) => changeTheme("font_title", event.target.value)} className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">{titleFontOptions.map((font) => <option key={font} value={font}>{font}</option>)}</select></label><label className="block text-xs font-medium text-zinc-500">Body Font<select value={invitation.theme.font_body} onChange={(event) => changeTheme("font_body", event.target.value)} className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">{bodyFontOptions.map((font) => <option key={font} value={font}>{font}</option>)}</select></label></div></SectionCard>
        <SectionCard title="Colors" icon={<Icon>◉</Icon>}><div className="space-y-2.5">{(["color_primary", "color_background", "color_accent"] as const).map((key) => <label key={key} className="flex items-center justify-between gap-2 text-xs font-medium capitalize text-zinc-500"><span>{key.replace("color_", "")}</span><span className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2 py-1"><input type="color" value={invitation.theme[key]} onChange={(event) => changeTheme(key, event.target.value)} className="h-5 w-5 cursor-pointer rounded border-0 p-0" /><span className="w-[68px] font-mono text-[10px] uppercase">{invitation.theme[key]}</span></span></label>)}</div></SectionCard>
        <SectionCard title="Music" icon={<Icon>♫</Icon>} defaultOpen={false}><p className="text-xs leading-5 text-zinc-500">Music remains sample-only. Set any audio field in the Content panel to test template values.</p></SectionCard>
        <SectionCard title="Content List" icon={<Icon>☷</Icon>}>
          {page === "main" ? <ContentSectionList order={invitation.sectionOrder} sections={snapshot.template.pages.find((item) => item.id === "main")?.sections ?? []} onMove={moveSection} onReorder={reorderSection} /> : <div className="space-y-2"><p className="text-xs text-zinc-400">Sections in this page</p>{(activePage?.sections ?? []).map((section) => <div key={section.id} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700">{section.section_type_id.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())}</div>)}</div>}
        </SectionCard>
      </div></Panel>
      <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="flex shrink-0 items-center justify-center gap-3 border-b border-zinc-100 py-3">{snapshot.template.pages.map((item, index) => <button key={item.id} onClick={() => setPage(item.id)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${page === item.id ? "bg-indigo-100 text-indigo-700" : "text-zinc-400 hover:text-zinc-700"}`}>{index + 1}. {item.label}</button>)}</div>
        <div className="min-h-0 flex-1 overflow-auto p-5">
          <div className="flex min-h-full min-w-full items-center-safe justify-center-safe py-2">
            {device === "desktop" ? (
              <div className="shrink-0" style={{ width: LAPTOP_MOCKUP_W * zoom, height: LAPTOP_MOCKUP_H * zoom }}>
                <div className="relative" style={{ width: LAPTOP_MOCKUP_W, height: LAPTOP_MOCKUP_H, transform: `scale(${zoom})`, transformOrigin: "top left" }}>
                  <div className="absolute overflow-hidden" style={{ ...LAPTOP_SCREEN_INSET, backgroundImage: `url('${wallpaper}')`, backgroundPosition: "center", backgroundSize: "cover", backgroundRepeat: "no-repeat" }}>
                    <PreviewFrame html={html} page={page} userData={invitation.userData} theme={invitation.theme} scrollRequest={scrollRequest} onPageChange={setPage} device="desktop" />
                  </div>
                  <img src="/laptop.png" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
                </div>
              </div>
            ) : (
              <div style={{ width: frameWidth, height: frameHeight }} className="shrink-0 overflow-hidden rounded-[2.25rem] border-[8px] border-zinc-950 bg-zinc-950 shadow-2xl">
                <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", width: 375, height: 812 }}>
                  <PreviewFrame html={html} page={page} userData={invitation.userData} theme={invitation.theme} scrollRequest={scrollRequest} onPageChange={setPage} device="mobile" />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 justify-center border-t border-zinc-100 py-3"><div className="flex items-center gap-3 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm shadow-sm"><button onClick={() => setZoom((value) => Math.max(device === "desktop" ? 0.3 : 0.5, +(value - 0.1).toFixed(1)))} className="text-zinc-500">−</button><span className="min-w-12 text-center text-xs font-medium text-zinc-600">⌕ {Math.round(zoom * 100)}%</span><button onClick={() => setZoom((value) => Math.min(device === "desktop" ? 1.5 : 1, +(value + 0.1).toFixed(1)))} className="text-zinc-500">+</button></div></div>
      </section>
      <Panel title="Content" subtitle="Update sample content and settings"><div className="space-y-3">{page === snapshot.template.pages[0]?.id && desktopBackgroundField && <SectionCard title={desktopBackgroundField.label || "Background Desktop"} icon={<Icon>▣</Icon>} defaultOpen={false}><p className="mb-3 text-xs text-zinc-400">Shown behind the invitation on desktop.</p><FieldControl field={desktopBackgroundField} value={invitation.userData[desktopBackgroundField.key] ?? ""} onChange={(value) => changeValue(desktopBackgroundField.key, value)} /></SectionCard>}{orderedFieldGroups.map(([section, group]) => <SectionCard key={section} title={section.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())} icon={<Icon>✦</Icon>} onOpen={() => scrollToGroup(section, group)}><div className="space-y-4">{group.filter((field) => activeSectionIds.has(section) || activePageFieldKeys.has(field.key)).map((field) => <label key={field.key} className="block" onClickCapture={() => scrollToField(field)}><span className="mb-1.5 block text-sm font-medium text-zinc-700">{field.label}{field.required && <span className="ml-0.5 text-indigo-500">*</span>}</span><FieldControl field={field} value={invitation.userData[field.key] ?? ""} onChange={(value) => changeValue(field.key, value)} /></label>)}</div></SectionCard>)}</div></Panel>
    </div>
  </main>
}
