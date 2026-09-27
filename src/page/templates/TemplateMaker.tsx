import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import type { Template, SectionTypeDef, Invitation, SectionConfig } from "@/lib/template/types"
import { MOCK_TEMPLATE, SECTION_TYPES, createDefaultInvitation } from "@/lib/template/mock-data"
import { renderInvitation, renderPreviewError } from "@/lib/template/renderer"
import { openTemplatePreview } from "@/lib/template/preview-window"
import { parseThemeJson, parseSchemaJson, findTemplateJsonIssue } from "@/lib/template/validate"
import { getTemplate, saveTemplate } from "@/lib/template/template-store"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { formatHtml, formatCss, formatJs, formatJson } from "@/utils/formatCode"

// ─── Types ────────────────────────────────────────────────────────────────────

type CodeTab = "html" | "css" | "js"

type Selection =
  | { kind: "section"; sectionTypeId: string; tab: CodeTab }
  | { kind: "schema" }
  | { kind: "theme" }
  | null

type NewSectionState = { pageId: string; name: string } | null
type NewPageState = { name: string } | null

// ─── JSON editor ──────────────────────────────────────────────────────────────

const EXAMPLE_THEME = JSON.stringify({
  color_primary: "#1a1a1a",
  color_accent: "#c9a96e",
  color_background: "#fafaf8",
  font_title: "Playfair Display",
  font_body: "Inter",
}, null, 2)

const EXAMPLE_SCHEMA = JSON.stringify({
  fields: [
    { key: "guest_name",    label: "Nama Tamu",        type: "text",     section: "cover",  required: false, placeholder: "Tamu Undangan" },
    { key: "bride_name",    label: "Nama Mempelai 1",  type: "text",     section: "couple", required: true,  placeholder: "Siti Rahayu" },
    { key: "groom_name",    label: "Nama Mempelai 2",  type: "text",     section: "couple", required: true,  placeholder: "Budi Santoso" },
    { key: "event_date",    label: "Tanggal Acara",    type: "date",     section: "event",  required: true },
    { key: "event_time",    label: "Waktu Acara",      type: "time",     section: "event",  required: true },
    { key: "event_venue",   label: "Nama Gedung",      type: "text",     section: "event",  required: true,  placeholder: "Gedung Serbaguna Melati" },
    { key: "event_address", label: "Alamat Lengkap",   type: "textarea", section: "event",  required: false, placeholder: "Jl. Mawar No. 12, Jakarta" },
    { key: "couple_photo",  label: "Foto Pasangan",    type: "image",    section: "couple", required: false },
    { key: "music_url",     label: "URL Musik",        type: "audio",    section: "cover",  required: false },
  ],
}, null, 2)

function JsonEditor({
  label,
  value,
  onChange,
  example,
  validate: validateValue,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  example?: string
  validate?: (v: string) => string | null
}) {
  const [error, setError] = useState<string | null>(null)
  const [formatting, setFormatting] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  const lastExternalRef = useRef(value)
  useEffect(() => {
    const el = ref.current
    if (!el || value === lastExternalRef.current) return
    lastExternalRef.current = value
    if (el.value !== value) el.value = value
  }, [value])

  const validate = (v: string) => {
    // The page passes a validator that checks the document's shape too, not just
    // its syntax — same rule that decides whether the edit reaches the preview.
    if (validateValue) { setError(validateValue(v)); return }
    try { JSON.parse(v); setError(null) } catch { setError("Invalid JSON") }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    lastExternalRef.current = v
    onChange(v)
    validate(v)
  }

  const loadExample = () => {
    if (!example || !ref.current) return
    ref.current.focus()
    ref.current.select()
    const ok = document.execCommand("insertText", false, example)
    if (!ok) {
      ref.current.value = example
      ref.current.dispatchEvent(new Event("input", { bubbles: true }))
    }
    lastExternalRef.current = example
    onChange(example)
    validate(example)
  }

  const handleFormat = async () => {
    if (!ref.current || error) return
    setFormatting(true)
    try {
      const formatted = await formatJson(ref.current.value)
      ref.current.value = formatted
      lastExternalRef.current = formatted
      onChange(formatted)
      validate(formatted)
    } finally {
      setFormatting(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <span className="text-xs font-semibold text-foreground/80 uppercase tracking-widest">{label}</span>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-400">{error}</span>}
          <button
            onClick={handleFormat}
            disabled={formatting || !!error}
            className="text-[11px] text-muted-foreground hover:text-foreground border border-border hover:border-muted-foreground rounded px-2 py-0.5 transition-colors disabled:opacity-40"
          >
            {formatting ? "Formatting…" : "Prettier"}
          </button>
          {example && (
            <button
              onClick={loadExample}
              className="text-[11px] text-amber-400 hover:text-amber-300 border border-amber-800 hover:border-amber-600 rounded px-2 py-0.5 transition-colors"
            >
              Load Example
            </button>
          )}
        </div>
      </div>
      <textarea
        ref={ref}
        defaultValue={value}
        onChange={handleChange}
        spellCheck={false}
        className="flex-1 resize-none bg-background text-foreground text-xs font-mono p-4 focus:outline-none leading-relaxed"
      />
    </div>
  )
}

// ─── Section code editor ──────────────────────────────────────────────────────

function SectionCodeEditor({
  sectionType,
  tab,
  onTabChange,
  onChange,
}: {
  sectionType: SectionTypeDef
  tab: CodeTab
  onTabChange: (t: CodeTab) => void
  onChange: (field: CodeTab, value: string) => void
}) {
  const tabs: CodeTab[] = ["html", "css", "js"]
  const [formatting, setFormatting] = useState(false)
  const formatters: Record<CodeTab, (code: string) => Promise<string>> = { html: formatHtml, css: formatCss, js: formatJs }

  const handleFormat = async () => {
    setFormatting(true)
    try {
      const formatted = await formatters[tab](sectionType[tab])
      onChange(tab, formatted)
    } finally {
      setFormatting(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-0.5 px-3 pt-2 pb-0 border-b border-border bg-card shrink-0">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => onTabChange(t)}
            className={`px-4 py-1.5 text-xs font-mono font-semibold rounded-t transition-colors ${
              tab === t
                ? "bg-background text-amber-400 border-t border-l border-r border-border"
                : "text-muted-foreground hover:text-foreground/80"
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 pb-1">
          <button
            onClick={handleFormat}
            disabled={formatting}
            className="text-[11px] text-muted-foreground hover:text-foreground border border-border hover:border-muted-foreground rounded px-2 py-0.5 transition-colors disabled:opacity-40"
          >
            {formatting ? "Formatting…" : "Prettier"}
          </button>
          <span className="text-[11px] text-muted-foreground/60 font-mono">{sectionType.id}</span>
        </div>
      </div>
      <textarea
        key={`${sectionType.id}-${tab}`}
        value={sectionType[tab]}
        onChange={(e) => onChange(tab, e.target.value)}
        spellCheck={false}
        className="flex-1 resize-none bg-background text-foreground text-xs font-mono p-4 focus:outline-none leading-relaxed"
        placeholder={tab === "js" ? "// Optional JS for this section" : ""}
      />
    </div>
  )
}

// ─── File tree ────────────────────────────────────────────────────────────────

function FileTree({
  template,
  sectionTypes,
  selection,
  onSelect,
  onAddSectionType,
  onAddSectionToPage,
  onRemoveSectionFromPage,
  onReorderSection,
  onDeleteSectionType,
  onAddPage,
  onDeletePage,
}: {
  template: Template
  sectionTypes: Record<string, SectionTypeDef>
  selection: Selection
  onSelect: (s: Selection) => void
  onAddSectionType: (id: string) => void
  onAddSectionToPage: (pageId: string, sectionTypeId: string) => void
  onRemoveSectionFromPage: (pageId: string, sectionId: string) => void
  onReorderSection: (pageId: string, fromIdx: number, toIdx: number) => void
  onDeleteSectionType: (id: string) => void
  onAddPage: (id: string, label: string) => void
  onDeletePage: (id: string) => void
}) {
  const [newSection, setNewSection] = useState<NewSectionState>(null)
  const newInputRef = useRef<HTMLInputElement>(null)
  const [newPage, setNewPage] = useState<NewPageState>(null)
  const newPageInputRef = useRef<HTMLInputElement>(null)

  const dragPage = useRef<string | null>(null)
  const dragIdx = useRef<number | null>(null)
  const [dragOverKey, setDragOverKey] = useState<string | null>(null)

  useEffect(() => {
    if (newSection) setTimeout(() => newInputRef.current?.focus(), 30)
  }, [newSection])

  useEffect(() => {
    if (newPage) setTimeout(() => newPageInputRef.current?.focus(), 30)
  }, [newPage])

  const commitNewPage = (name: string) => {
    const id = name.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
    if (!id) { setNewPage(null); return }
    if (template.pages.find((p) => p.id === id)) { setNewPage(null); return }
    onAddPage(id, name.trim() || id)
    setNewPage(null)
  }

  const commitNewSection = (pageId: string, name: string) => {
    const id = name.trim()
    if (!id || !/^[a-z0-9_]+$/.test(id)) { setNewSection(null); return }
    onAddSectionType(id)
    onAddSectionToPage(pageId, id)
    setNewSection(null)
  }

  const isActiveSection = (id: string) =>
    selection?.kind === "section" && selection.sectionTypeId === id

  const itemCls = (active: boolean) =>
    `group flex items-center gap-1.5 w-full px-2 py-1.5 text-left text-xs rounded-md transition-colors ${
      active ? "bg-amber-900/40 text-amber-300" : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-border shrink-0">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Template Structure</h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground/60 font-mono">{template.id}</p>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        <button onClick={() => onSelect({ kind: "theme" })} className={itemCls(selection?.kind === "theme")}>
          <span className="text-[10px] font-bold font-mono text-yellow-400 shrink-0 w-8">JSON</span>
          theme.json
        </button>
        <button onClick={() => onSelect({ kind: "schema" })} className={itemCls(selection?.kind === "schema")}>
          <span className="text-[10px] font-bold font-mono text-yellow-400 shrink-0 w-8">JSON</span>
          schema.json
        </button>

        {template.pages.map((page) => (
          <div key={page.id} className="mt-4">
            <div className="group/page flex items-center justify-between px-2 mb-1">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
                {page.id}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    if (page.sections.length > 0 && !confirm(`Delete page "${page.id}" and all its sections?`)) return
                    onDeletePage(page.id)
                  }}
                  className="opacity-0 group-hover/page:opacity-100 rounded p-0.5 text-muted-foreground/60 hover:text-red-400 hover:bg-red-900/40 transition-colors"
                  title="Delete page"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <button
                  onClick={() => setNewSection({ pageId: page.id, name: "" })}
                  className="text-muted-foreground/60 hover:text-amber-400 transition-colors"
                  title="Add section"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            {page.sections.length === 0 && newSection?.pageId !== page.id && (
              <p className="px-4 py-1 text-[11px] text-muted-foreground/40 italic">Empty — click + to add</p>
            )}

            {page.sections.map((sec, idx) => {
              const overKey = `${page.id}:${idx}`
              return (
                <div
                  key={sec.id}
                  draggable
                  onDragStart={() => { dragPage.current = page.id; dragIdx.current = idx }}
                  onDragOver={(e) => { e.preventDefault(); setDragOverKey(overKey) }}
                  onDrop={() => {
                    if (dragPage.current === page.id && dragIdx.current !== null && dragIdx.current !== idx) {
                      onReorderSection(page.id, dragIdx.current, idx)
                    }
                    dragPage.current = null; dragIdx.current = null; setDragOverKey(null)
                  }}
                  onDragEnd={() => { dragPage.current = null; dragIdx.current = null; setDragOverKey(null) }}
                  className={`group flex items-center gap-1.5 w-full px-2 py-1.5 text-xs rounded-md transition-colors cursor-grab active:cursor-grabbing ${
                    isActiveSection(sec.section_type_id)
                      ? "bg-amber-900/40 text-amber-300"
                      : dragOverKey === overKey
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  onClick={() => onSelect({ kind: "section", sectionTypeId: sec.section_type_id, tab: "html" })}
                >
                  <svg className="h-3 w-3 shrink-0 text-muted-foreground/60 group-hover:text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                  </svg>
                  <span className="text-[10px] font-bold font-mono text-orange-400 shrink-0 w-8">HTML</span>
                  <span className="flex-1 truncate">{sec.section_type_id}</span>
                  {!sectionTypes[sec.section_type_id] && (
                    <span className="text-[10px] text-red-400 shrink-0">!</span>
                  )}
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); if (idx > 0) onReorderSection(page.id, idx, idx - 1) }}
                      disabled={idx === 0}
                      className="rounded p-0.5 hover:bg-secondary disabled:opacity-20"
                    >
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (idx < page.sections.length - 1) onReorderSection(page.id, idx, idx + 1) }}
                      disabled={idx === page.sections.length - 1}
                      className="rounded p-0.5 hover:bg-secondary disabled:opacity-20"
                    >
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemoveSectionFromPage(page.id, sec.id) }}
                      className="rounded p-0.5 hover:bg-red-900/60 text-muted-foreground/60 hover:text-red-400"
                    >
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}

            {newSection?.pageId === page.id && (
              <div className="mx-1 mt-1 flex items-center gap-1 rounded-md border border-amber-700/60 bg-muted px-2 py-1">
                <span className="text-[10px] font-bold font-mono text-orange-400 shrink-0 w-8">HTML</span>
                <input
                  ref={newInputRef}
                  value={newSection.name}
                  onChange={(e) => {
                    const val = e.target.value
                    const cleaned = val.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
                    setNewSection({ ...newSection, name: cleaned })
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitNewSection(page.id, newSection.name)
                    if (e.key === "Escape") setNewSection(null)
                  }}
                  placeholder="hero_section"
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none font-mono"
                />
                <button onClick={() => commitNewSection(page.id, newSection.name)} className="text-amber-400 hover:text-amber-300">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button onClick={() => setNewSection(null)} className="text-muted-foreground/60 hover:text-muted-foreground">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}

        <div className="mt-4 px-2">
          {newPage ? (
            <div className="flex items-center gap-1 rounded-md border border-amber-700/60 bg-muted px-2 py-1">
              <svg className="h-3 w-3 shrink-0 text-muted-foreground/60" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              <input
                ref={newPageInputRef}
                value={newPage.name}
                onChange={(e) => setNewPage({ name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitNewPage(newPage.name)
                  if (e.key === "Escape") setNewPage(null)
                }}
                placeholder="page_id"
                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none font-mono"
              />
              <button onClick={() => commitNewPage(newPage.name)} className="text-amber-400 hover:text-amber-300">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button onClick={() => setNewPage(null)} className="text-muted-foreground/60 hover:text-muted-foreground">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setNewPage({ name: "" })}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 hover:text-amber-400 transition-colors"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Page
            </button>
          )}
        </div>

        {(() => {
          const usedIds = new Set(template.pages.flatMap((p) => p.sections.map((s) => s.section_type_id)))
          const unusedIds = Object.keys(sectionTypes).filter((id) => !usedIds.has(id))
          if (!unusedIds.length) return null
          return (
            <div className="mt-4">
              <div className="flex items-center gap-1 px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
                Library — not in any page
              </div>
              {unusedIds.map((id) => (
                <div key={id} className="group flex flex-col rounded-md hover:bg-muted transition-colors">
                  <div className="flex items-center gap-1.5 w-full px-2 py-1.5">
                    <button
                      onClick={() => onSelect({ kind: "section", sectionTypeId: id, tab: "html" })}
                      className={`flex items-center gap-1.5 flex-1 min-w-0 text-left text-xs ${
                        isActiveSection(id) ? "text-amber-300" : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      <span className="text-[10px] font-bold font-mono text-orange-400 shrink-0 w-8">HTML</span>
                      <span className="flex-1 truncate">{id}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (!confirm(`Delete section type "${id}"? This cannot be undone.`)) return
                        onDeleteSectionType(id)
                      }}
                      className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-red-900/60 text-muted-foreground/60 hover:text-red-400 transition-colors shrink-0"
                      title="Delete section type"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex gap-1 px-2 pb-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-muted-foreground/60 mr-1 self-center">Add to →</span>
                    {template.pages.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => onAddSectionToPage(p.id, id)}
                        className="rounded px-2 py-0.5 text-[10px] font-semibold bg-secondary text-foreground/80 hover:bg-amber-700 hover:text-white transition-colors uppercase tracking-wide"
                      >
                        {p.id}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        })()}
      </div>
    </div>
  )
}

// ─── Preview ──────────────────────────────────────────────────────────────────

function PreviewWithPageControl({ html: liveHtml, page }: { html: string; page: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(812)
  const isLoadedRef = useRef(false)
  const pageRef = useRef(page)
  pageRef.current = page

  // Reloading the iframe on every keystroke freezes the editor on large pastes.
  const html = useDebouncedValue(liveHtml, 500)

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "memoriaResize" && typeof e.data.height === "number") {
        setHeight(e.data.height)
      }
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !html) return
    isLoadedRef.current = false
    setHeight(812)
    const onLoad = () => {
      isLoadedRef.current = true
      iframe.contentWindow?.postMessage({ type: "memoriaGoTo", pageId: pageRef.current }, "*")
    }
    iframe.addEventListener("load", onLoad, { once: true })
    iframe.setAttribute("srcdoc", html)
    return () => iframe.removeEventListener("load", onLoad)
  }, [html])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !isLoadedRef.current) return
    iframe.contentWindow?.postMessage({ type: "memoriaGoTo", pageId: page }, "*")
  }, [page])

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative overflow-hidden shrink-0"
        style={{
          width: 391,
          borderRadius: "2.5rem",
          background: "#1a1a1a",
          border: "8px solid #111",
          outline: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.4)",
        }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 z-10 rounded-b-xl"
          style={{ width: 120, height: 28, background: "#111" }}
        />
        <iframe
          ref={iframeRef}
          sandbox="allow-scripts"
          style={{ width: 375, height, display: "block", border: 0 }}
          title="Template Preview"
        />
      </div>
      <p className="text-xs text-muted-foreground pb-4">Live Preview — 375px</p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TemplateMaker() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const templateId = searchParams.get("id") ?? MOCK_TEMPLATE.id

  const [template, setTemplate] = useState<Template>(MOCK_TEMPLATE)
  const [sectionTypes, setSectionTypes] = useState<Record<string, SectionTypeDef>>(SECTION_TYPES)
  const [selection, setSelection] = useState<Selection>(null)
  const [saved, setSaved] = useState(false)
  const [previewPage, setPreviewPage] = useState<string>("cover")
  const [themeJson, setThemeJson] = useState("")
  const [schemaJson, setSchemaJson] = useState("")
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const stored = getTemplate(templateId)
    if (stored) {
      setTemplate(stored.template)
      setSectionTypes(stored.sectionTypes)
      setThemeJson(JSON.stringify(stored.template.theme_defaults, null, 2))
      setSchemaJson(JSON.stringify(stored.template.schema, null, 2))
    } else {
      navigate("/templates")
      return
    }
    setLoaded(true)
    setSelection(null)
  }, [templateId, navigate])

  const previewInvitation = useMemo<Invitation>(() => {
    let parsedTheme = template.theme_defaults
    try { parsedTheme = JSON.parse(themeJson) } catch { /* ignore */ }
    const mainPage = template.pages.find((p) => p.id === "main")
    const sectionOrder = mainPage ? mainPage.sections.map((s) => s.id) : []
    return { ...createDefaultInvitation(), theme: parsedTheme, sectionOrder }
  }, [template, themeJson])

  const jsonIssue = useMemo(() => findTemplateJsonIssue(themeJson, schemaJson), [themeJson, schemaJson])

  const previewHtml = useMemo(() => {
    try {
      return renderInvitation(template, previewInvitation, sectionTypes)
    } catch (e) {
      return renderPreviewError(e)
    }
  }, [template, previewInvitation, sectionTypes])

  const handleThemeJson = useCallback((v: string) => {
    setThemeJson(v)
    const parsed = parseThemeJson(v)
    if (parsed.ok) setTemplate((t) => ({ ...t, theme_defaults: parsed.value }))
  }, [])

  const handleSchemaJson = useCallback((v: string) => {
    setSchemaJson(v)
    const parsed = parseSchemaJson(v)
    if (parsed.ok) setTemplate((t) => ({ ...t, schema: parsed.value }))
  }, [])

  const validateThemeJson = useCallback((v: string) => { const r = parseThemeJson(v); return r.ok ? null : r.error }, [])
  const validateSchemaJson = useCallback((v: string) => { const r = parseSchemaJson(v); return r.ok ? null : r.error }, [])

  const handleSectionCode = useCallback((id: string, field: CodeTab, value: string) => {
    setSectionTypes((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }, [])

  const handleDeleteSectionType = useCallback((id: string) => {
    setSectionTypes((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setSelection((s) => (s?.kind === "section" && s.sectionTypeId === id ? null : s))
  }, [])

  const handleAddPage = useCallback((id: string, label: string) => {
    setTemplate((prev) => ({
      ...prev,
      pages: [...prev.pages, { id, label, sections: [] }],
    }))
  }, [])

  const handleDeletePage = useCallback((id: string) => {
    setTemplate((prev) => ({
      ...prev,
      pages: prev.pages.filter((p) => p.id !== id),
    }))
  }, [])

  const handleAddSectionType = useCallback((id: string) => {
    if (!id || sectionTypes[id]) return
    setSectionTypes((prev) => ({
      ...prev,
      [id]: {
        id,
        html: `<section class="s-${id}">\n  <!-- ${id} -->\n</section>`,
        css: `.s-${id} {\n  padding: 4rem 2rem;\n  background: var(--color-background);\n}`,
        js: "",
        schema: { slots: [], styles: [] },
      },
    }))
    setSelection({ kind: "section", sectionTypeId: id, tab: "html" })
  }, [sectionTypes])

  const handleAddSectionToPage = useCallback((pageId: string, sectionTypeId: string) => {
    setTemplate((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => {
        if (p.id !== pageId) return p
        if (p.sections.find((s) => s.section_type_id === sectionTypeId)) return p
        const newSection: SectionConfig = {
          id: `${sectionTypeId}_${Date.now()}`,
          section_type_id: sectionTypeId,
        }
        return { ...p, sections: [...p.sections, newSection] }
      }),
    }))
  }, [])

  const handleRemoveSectionFromPage = useCallback((pageId: string, sectionId: string) => {
    setTemplate((prev) => ({
      ...prev,
      pages: prev.pages.map((p) =>
        p.id !== pageId ? p : { ...p, sections: p.sections.filter((s) => s.id !== sectionId) }
      ),
    }))
  }, [])

  const handleReorderSection = useCallback((pageId: string, fromIdx: number, toIdx: number) => {
    setTemplate((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => {
        if (p.id !== pageId) return p
        const sections = [...p.sections]
        const [moved] = sections.splice(fromIdx, 1)
        sections.splice(toIdx, 0, moved)
        return { ...p, sections }
      }),
    }))
  }, [])

  const handleTabChange = useCallback((tab: CodeTab) => {
    setSelection((s) => s?.kind === "section" ? { ...s, tab } : s)
  }, [])

  const handleSave = () => {
    if (jsonIssue) return
    saveTemplate(template, sectionTypes)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handlePreviewTemplate = () => {
    openTemplatePreview(previewHtml, {
      userData: previewInvitation.userData,
      theme: previewInvitation.theme,
      activePage: previewPage,
    })
  }

  if (!loaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground text-sm">
        Loading template...
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Top bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/templates")}
            className="text-muted-foreground hover:text-foreground/80 transition-colors"
            title="Back to templates"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Templates</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm font-semibold text-foreground">{template.name}</span>
          <span className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground font-mono">{template.id}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviewTemplate}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview
          </button>
          {jsonIssue && (
            <span title={`${jsonIssue.pane}: ${jsonIssue.message}`} className="flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
              Invalid {jsonIssue.pane}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={jsonIssue !== null}
            title={jsonIssue ? `Fix ${jsonIssue.pane} before saving — ${jsonIssue.message}` : undefined}
            className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${
              jsonIssue ? "bg-muted text-muted-foreground cursor-not-allowed" : saved ? "bg-green-700 text-white" : "bg-amber-600 hover:bg-amber-500 text-white"
            }`}
          >
            {saved ? "Saved!" : "Save Template"}
          </button>
        </div>
      </header>

      {/* 3-column body */}
      <div className="flex min-h-0 flex-1">
        {/* Left: file tree */}
        <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col overflow-hidden">
          <FileTree
            template={template}
            sectionTypes={sectionTypes}
            selection={selection}
            onSelect={setSelection}
            onAddSectionType={handleAddSectionType}
            onAddSectionToPage={handleAddSectionToPage}
            onRemoveSectionFromPage={handleRemoveSectionFromPage}
            onReorderSection={handleReorderSection}
            onDeleteSectionType={handleDeleteSectionType}
            onAddPage={handleAddPage}
            onDeletePage={handleDeletePage}
          />
        </aside>

        {/* Center: code editor */}
        <main className="flex flex-1 flex-col overflow-hidden bg-background">
          {selection === null ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground/40">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <p className="text-sm">Select a file from the tree to edit</p>
            </div>
          ) : selection.kind === "section" ? (
            sectionTypes[selection.sectionTypeId] ? (
              <SectionCodeEditor
                sectionType={sectionTypes[selection.sectionTypeId]}
                tab={selection.tab}
                onTabChange={handleTabChange}
                onChange={(field, val) => handleSectionCode(selection.sectionTypeId, field, val)}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center text-red-400 text-sm">
                Section type "{selection.sectionTypeId}" not found.
              </div>
            )
          ) : selection.kind === "theme" ? (
            <JsonEditor label="theme.json" value={themeJson} onChange={handleThemeJson} example={EXAMPLE_THEME} validate={validateThemeJson} />
          ) : (
            <JsonEditor label="schema.json" value={schemaJson} onChange={handleSchemaJson} example={EXAMPLE_SCHEMA} validate={validateSchemaJson} />
          )}
        </main>

        {/* Right: live preview */}
        <aside className="w-120 shrink-0 border-l border-border bg-card flex flex-col overflow-hidden">
          <div className="flex items-center gap-1 border-b border-border px-4 py-2 shrink-0">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mr-3">Live Preview</h2>
            {template.pages.map((p) => (
              <button
                key={p.id}
                onClick={() => setPreviewPage(p.id)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  previewPage === p.id
                    ? "bg-amber-900/50 text-amber-300 ring-1 ring-amber-700"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground/80"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto flex items-start justify-center p-4">
            <PreviewWithPageControl html={previewHtml} page={previewPage} />
          </div>
        </aside>
      </div>
    </div>
  )
}
