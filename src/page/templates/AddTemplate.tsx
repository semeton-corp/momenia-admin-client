import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { createInvitationTemplate } from "@/api/cms/invitation-templates"
import { getInvitationTemplateCategories, type InvitationTemplateCategory } from "@/api/cms/invitation-template-categories"
import { getInvitationTemplateTags, type InvitationTemplateTag } from "@/api/cms/invitation-template-tags"
import { uploadObjectWithPresignedUrl } from "@/api/objects"
import type { Template, SectionTypeDef, Invitation, SectionConfig } from "@/lib/template/types"
import { renderInvitation } from "@/lib/template/renderer"
import { createDefaultInvitation } from "@/lib/template/mock-data"

// ─── Shared types ─────────────────────────────────────────────────────────────

type SelectedItem = { id: number | null; name: string }
type CodeTab = "html" | "css" | "js"
type Selection =
  | { kind: "section"; sectionTypeId: string; tab: CodeTab }
  | { kind: "schema" }
  | { kind: "theme" }
  | null
type NewSectionState = { pageId: string; name: string } | null
type NewPageState = { name: string } | null

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(raw: string): string {
  if (!raw) return ""
  return Number(raw).toLocaleString("id-ID")
}

function makeBlankTemplate(): Template {
  return {
    id: "__new__",
    name: "",
    theme_defaults: {
      color_primary: "#1a1a1a",
      color_accent: "#d4af37",
      color_background: "#ffffff",
      font_title: "Playfair Display",
      font_body: "Inter",
    },
    pages: [
      { id: "cover", label: "Cover", sections: [] },
      { id: "main", label: "Main Invitation", sections: [] },
    ],
    schema: { fields: [] },
  }
}

const EXAMPLE_THEME = JSON.stringify({
  color_primary: "#1a1a1a",
  color_accent: "#d4af37",
  color_background: "#ffffff",
  font_title: "Playfair Display",
  font_body: "Inter",
}, null, 2)

const EXAMPLE_SCHEMA = JSON.stringify({
  fields: [
    {
      key: "headline",
      label: "Nama Pasangan",
      type: "text",
      section: "hero_section",
      required: true,
      placeholder: "Budi & Rina",
    },
    {
      key: "couple_photo",
      label: "Foto Pasangan",
      type: "image",
      section: "cover_section",
      required: false,
      placeholder: "https://example.com/couple.jpg",
    },
    {
      key: "bride_name",
      label: "Nama Pengantin Wanita",
      type: "text",
      section: "couple_section",
      required: true,
      placeholder: "Rina Astuti",
    },
    {
      key: "groom_name",
      label: "Nama Pengantin Pria",
      type: "text",
      section: "couple_section",
      required: true,
      placeholder: "Budi Santoso",
    },
    {
      key: "event_date",
      label: "Tanggal Acara",
      type: "date",
      section: "details_section",
      required: true,
    },
    {
      key: "event_time",
      label: "Waktu Acara",
      type: "time",
      section: "details_section",
      required: true,
    },
    {
      key: "venue_name",
      label: "Nama Venue",
      type: "text",
      section: "details_section",
      required: true,
      placeholder: "Gedung Balai Kartini",
    },
  ],
}, null, 2)

// ─── Combobox hook ────────────────────────────────────────────────────────────

function useCombobox<T extends { id: number; name: string }>(
  fetcher: (keyword?: string) => Promise<T[]>,
  debounceMs = 3000,
) {
  const [inputText, setInputText] = useState("")
  const [suggestions, setSuggestions] = useState<T[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchSuggestions = useCallback(async (keyword: string) => {
    setLoading(true)
    try {
      const results = await fetcher(keyword || undefined)
      setSuggestions(results)
      setOpen(true)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [fetcher])

  const handleInputChange = (text: string, onChangeCallback: (t: string) => void) => {
    setInputText(text)
    onChangeCallback(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(text), debounceMs)
  }

  return { inputText, setInputText, suggestions, open, loading, handleInputChange, closeDropdown: () => setOpen(false), openDropdown: () => { if (suggestions.length > 0) setOpen(true) } }
}

// ─── CategoryCombobox ─────────────────────────────────────────────────────────

function CategoryCombobox({ value, onChange, error }: { value: SelectedItem; onChange: (v: SelectedItem) => void; error?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { inputText, setInputText, suggestions, open, loading, handleInputChange, closeDropdown, openDropdown } = useCombobox(getInvitationTemplateCategories)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) closeDropdown() }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleSelect = (cat: InvitationTemplateCategory) => { setInputText(cat.name); onChange({ id: cat.id, name: cat.name }); closeDropdown() }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input type="text" value={inputText} onChange={(e) => handleInputChange(e.target.value, (t) => onChange({ id: null, name: t }))} onFocus={openDropdown} placeholder="e.g. Wedding Invitation"
          className={`w-full rounded-lg border bg-background px-4 py-2.5 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors ${error ? "border-destructive" : "border-border focus:border-indigo-500"}`} />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
            : <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>}
        </div>
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden max-h-52 overflow-y-auto">
          {suggestions.map((cat) => (
            <button key={cat.id} type="button" onMouseDown={(e) => { e.preventDefault(); handleSelect(cat) }} className="flex w-full items-center px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left">{cat.name}</button>
          ))}
          {!loading && inputText.trim() && !suggestions.find((c) => c.name.toLowerCase() === inputText.trim().toLowerCase()) && (
            <button type="button" onMouseDown={(e) => { e.preventDefault(); onChange({ id: null, name: inputText.trim() }); closeDropdown() }} className="flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-sm text-indigo-500 hover:bg-muted transition-colors text-left">
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Create "{inputText.trim()}"
            </button>
          )}
          {!loading && suggestions.length === 0 && <div className="px-4 py-2.5 text-sm text-muted-foreground">Start typing to search…</div>}
        </div>
      )}
      {value.name.trim() && !error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs">
          {value.id !== null
            ? <><svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg><span className="text-green-600">Existing category</span></>
            : <><svg className="h-3 w-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg><span className="text-indigo-500">Will create "{value.name}"</span></>}
        </p>
      )}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ─── TagsCombobox ─────────────────────────────────────────────────────────────

function TagsCombobox({ value, onChange, error }: { value: SelectedItem[]; onChange: (v: SelectedItem[]) => void; error?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { inputText, setInputText, suggestions, open, loading, handleInputChange, closeDropdown } = useCombobox(getInvitationTemplateTags)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) closeDropdown() }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const addTag = (item: SelectedItem) => {
    if (value.find((t) => t.name.toLowerCase() === item.name.toLowerCase())) return
    onChange([...value, item]); setInputText(""); inputRef.current?.focus(); closeDropdown()
  }

  const removeTag = (name: string) => onChange(value.filter((t) => t.name !== name))

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && inputText.trim()) { e.preventDefault(); addTag({ id: null, name: inputText.trim() }) }
    if (e.key === "Backspace" && !inputText && value.length > 0) removeTag(value[value.length - 1].name)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className={`flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border bg-background px-3 py-2 transition-colors cursor-text ${error ? "border-destructive" : "border-border focus-within:border-indigo-500"}`} onClick={() => inputRef.current?.focus()}>
        {value.map((tag) => (
          <span key={tag.name} className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
            {tag.name}
            <button type="button" onClick={(e) => { e.stopPropagation(); removeTag(tag.name) }} className="ml-0.5 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 p-0.5 transition-colors">
              <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </span>
        ))}
        <div className="relative flex flex-1 items-center min-w-24">
          <input ref={inputRef} type="text" value={inputText} onChange={(e) => handleInputChange(e.target.value, () => {})} onKeyDown={handleKeyDown} placeholder={value.length === 0 ? "e.g. Elegant, Modern…" : ""} className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
          {loading && <div className="absolute right-1 h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />}
        </div>
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden max-h-52 overflow-y-auto">
          {suggestions.filter((t) => !value.find((v) => v.name.toLowerCase() === t.name.toLowerCase())).map((tag) => (
            <button key={tag.id} type="button" onMouseDown={(e) => { e.preventDefault(); addTag({ id: tag.id, name: tag.name }) }} className="flex w-full items-center px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left">{tag.name}</button>
          ))}
          {!loading && inputText.trim() && !suggestions.find((t) => t.name.toLowerCase() === inputText.trim().toLowerCase()) && (
            <button type="button" onMouseDown={(e) => { e.preventDefault(); addTag({ id: null, name: inputText.trim() }) }} className="flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-sm text-indigo-500 hover:bg-muted transition-colors text-left">
              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Create "{inputText.trim()}"
            </button>
          )}
        </div>
      )}
      <p className="mt-1 text-xs text-muted-foreground">Type and press Enter or comma to add. Backspace to remove.</p>
      {error && <p className="mt-0.5 text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ─── PriceInput ───────────────────────────────────────────────────────────────

function PriceInput({ label, value, onChange }: { label: string; value: string; onChange: (raw: string) => void }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">Rp</span>
        <input type="text" inputMode="numeric" value={focused ? value : formatPrice(value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))} placeholder="0"
          className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none" />
      </div>
    </div>
  )
}

// ─── ImageUploader ────────────────────────────────────────────────────────────

function ImageUploader({ label, previewUrl, uploading, onFileSelect, error }: { label: string; previewUrl: string; uploading: boolean; onFileSelect: (file: File) => void; error?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="flex-1">
      <label className="mb-2 block text-sm font-medium text-foreground">{label} <span className="text-destructive">*</span></label>
      <div onClick={() => !uploading && inputRef.current?.click()} className={`relative flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-background transition-colors hover:border-muted-foreground/50 ${uploading ? "opacity-60 cursor-not-allowed" : ""}`}>
        {previewUrl ? <img src={previewUrl} alt={label} className="absolute inset-0 h-full w-full rounded-xl object-cover" /> : (
          <>
            <svg className="h-10 w-10 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Image Banner Empty</p>
              <p className="text-xs text-muted-foreground">Upload banner files to show on the landing page.</p>
              <p className="text-xs text-muted-foreground">(max size 1 Mb)</p>
            </div>
          </>
        )}
        {uploading && <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60"><div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" /></div>}
        {previewUrl && !uploading && <div className="absolute bottom-2 right-2 rounded bg-background/80 px-2 py-1 text-xs text-foreground backdrop-blur-sm">Click to replace</div>}
      </div>
      <div className="mt-2 flex justify-center">
        <button type="button" onClick={() => !uploading && inputRef.current?.click()} disabled={uploading} className="rounded-lg border border-border px-4 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-60">{uploading ? "Uploading..." : "Upload Files"}</button>
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) onFileSelect(file); e.target.value = "" }} />
    </div>
  )
}

// ─── TemplateMaker sub-components (inlined for step 2) ───────────────────────

function JsonEditor({ label, value, onChange, example }: { label: string; value: string; onChange: (v: string) => void; example?: string }) {
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLTextAreaElement>(null)
  const lastExternalRef = useRef(value)

  useEffect(() => {
    const el = ref.current
    if (!el || value === lastExternalRef.current) return
    lastExternalRef.current = value
    if (el.value !== value) el.value = value
  }, [value])

  const validate = (v: string) => {
    if (!v.trim()) { setError(null); return }
    try { JSON.parse(v); setError(null) } catch (e) { setError(`Invalid JSON: ${e instanceof Error ? e.message : "Parse error"}`) }
  }
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => { const v = e.target.value; lastExternalRef.current = v; onChange(v); validate(v) }
  const loadExample = () => {
    if (!example || !ref.current) return
    ref.current.value = example
    lastExternalRef.current = example
    onChange(example); validate(example)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <span className="text-xs font-semibold text-foreground/80 uppercase tracking-widest">{label}</span>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-400">{error}</span>}
          {example && <button onClick={loadExample} className="text-[11px] text-amber-400 hover:text-amber-300 border border-amber-800 hover:border-amber-600 rounded px-2 py-0.5 transition-colors">Load Example</button>}
        </div>
      </div>
      <textarea ref={ref} defaultValue={value} onChange={handleChange} spellCheck={false} className="flex-1 resize-none bg-background text-foreground text-xs font-mono p-4 focus:outline-none leading-relaxed" />
    </div>
  )
}

function SectionCodeEditor({ sectionType, tab, onTabChange, onChange }: { sectionType: SectionTypeDef; tab: CodeTab; onTabChange: (t: CodeTab) => void; onChange: (field: CodeTab, value: string) => void }) {
  const tabs: CodeTab[] = ["html", "css", "js"]
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-0.5 px-3 pt-2 pb-0 border-b border-border bg-card shrink-0">
        {tabs.map((t) => (
          <button key={t} onClick={() => onTabChange(t)} className={`px-4 py-1.5 text-xs font-mono font-semibold rounded-t transition-colors ${tab === t ? "bg-background text-amber-400 border-t border-l border-r border-border" : "text-muted-foreground hover:text-foreground/80"}`}>{t.toUpperCase()}</button>
        ))}
        <div className="ml-auto flex items-center gap-2 pb-1">
          <span className="text-[11px] text-muted-foreground/60 font-mono">{sectionType.id}</span>
        </div>
      </div>
      <textarea key={`${sectionType.id}-${tab}`} value={sectionType[tab]} onChange={(e) => onChange(tab, e.target.value)} spellCheck={false} className="flex-1 resize-none bg-background text-foreground text-xs font-mono p-4 focus:outline-none leading-relaxed" placeholder={tab === "js" ? "// Optional JS for this section" : ""} />
    </div>
  )
}

function FileTree({ template, sectionTypes, selection, onSelect, onAddSectionType, onAddSectionToPage, onRemoveSectionFromPage, onReorderSection, onDeleteSectionType, onAddPage, onDeletePage }: {
  template: Template; sectionTypes: Record<string, SectionTypeDef>; selection: Selection
  onSelect: (s: Selection) => void; onAddSectionType: (id: string) => void; onAddSectionToPage: (pageId: string, sectionTypeId: string) => void
  onRemoveSectionFromPage: (pageId: string, sectionId: string) => void; onReorderSection: (pageId: string, fromIdx: number, toIdx: number) => void
  onDeleteSectionType: (id: string) => void; onAddPage: (id: string, label: string) => void; onDeletePage: (id: string) => void
}) {
  const [newSection, setNewSection] = useState<NewSectionState>(null)
  const newInputRef = useRef<HTMLInputElement>(null)
  const [newPage, setNewPage] = useState<NewPageState>(null)
  const newPageInputRef = useRef<HTMLInputElement>(null)
  const dragPage = useRef<string | null>(null)
  const dragIdx = useRef<number | null>(null)
  const [dragOverKey, setDragOverKey] = useState<string | null>(null)

  useEffect(() => { if (newSection) setTimeout(() => newInputRef.current?.focus(), 30) }, [newSection])
  useEffect(() => { if (newPage) setTimeout(() => newPageInputRef.current?.focus(), 30) }, [newPage])

  const commitNewPage = (name: string) => {
    const id = name.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
    if (!id || template.pages.find((p) => p.id === id)) { setNewPage(null); return }
    onAddPage(id, name.trim() || id); setNewPage(null)
  }

  const commitNewSection = (pageId: string, name: string) => {
    const id = name.trim()
    if (!id || !/^[a-z0-9_]+$/.test(id)) { setNewSection(null); return }
    onAddSectionType(id); onAddSectionToPage(pageId, id); setNewSection(null)
  }

  const isActiveSection = (id: string) => selection?.kind === "section" && selection.sectionTypeId === id
  const itemCls = (active: boolean) => `group flex items-center gap-1.5 w-full px-2 py-1.5 text-left text-xs rounded-md transition-colors ${active ? "bg-amber-900/40 text-amber-300" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-border shrink-0">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Template Structure</h2>
      </div>
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        <button onClick={() => onSelect({ kind: "theme" })} className={itemCls(selection?.kind === "theme")}><span className="text-[10px] font-bold font-mono text-yellow-400 shrink-0 w-8">JSON</span>theme.json</button>
        <button onClick={() => onSelect({ kind: "schema" })} className={itemCls(selection?.kind === "schema")}><span className="text-[10px] font-bold font-mono text-yellow-400 shrink-0 w-8">JSON</span>schema.json</button>

        {template.pages.map((page) => (
          <div key={page.id} className="mt-4">
            <div className="group/page flex items-center justify-between px-2 mb-1">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                {page.id}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { if (page.sections.length > 0 && !confirm(`Delete page "${page.id}" and all its sections?`)) return; onDeletePage(page.id) }} className="opacity-0 group-hover/page:opacity-100 rounded p-0.5 text-muted-foreground/60 hover:text-red-400 hover:bg-red-900/40 transition-colors" title="Delete page">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <button onClick={() => setNewSection({ pageId: page.id, name: "" })} className="text-muted-foreground/60 hover:text-amber-400 transition-colors" title="Add section">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>
            </div>

            {page.sections.length === 0 && newSection?.pageId !== page.id && <p className="px-4 py-1 text-[11px] text-muted-foreground/40 italic">Empty — click + to add</p>}

            {page.sections.map((sec, idx) => {
              const overKey = `${page.id}:${idx}`
              return (
                <div key={sec.id} draggable onDragStart={() => { dragPage.current = page.id; dragIdx.current = idx }} onDragOver={(e) => { e.preventDefault(); setDragOverKey(overKey) }} onDrop={() => { if (dragPage.current === page.id && dragIdx.current !== null && dragIdx.current !== idx) onReorderSection(page.id, dragIdx.current, idx); dragPage.current = null; dragIdx.current = null; setDragOverKey(null) }} onDragEnd={() => { dragPage.current = null; dragIdx.current = null; setDragOverKey(null) }}
                  className={`group flex items-center gap-1.5 w-full px-2 py-1.5 text-xs rounded-md transition-colors cursor-grab active:cursor-grabbing ${isActiveSection(sec.section_type_id) ? "bg-amber-900/40 text-amber-300" : dragOverKey === overKey ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                  onClick={() => onSelect({ kind: "section", sectionTypeId: sec.section_type_id, tab: "html" })}>
                  <svg className="h-3 w-3 shrink-0 text-muted-foreground/60 group-hover:text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" /></svg>
                  <span className="text-[10px] font-bold font-mono text-orange-400 shrink-0 w-8">HTML</span>
                  <span className="flex-1 truncate">{sec.section_type_id}</span>
                  {!sectionTypes[sec.section_type_id] && <span className="text-[10px] text-red-400 shrink-0">!</span>}
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); if (idx > 0) onReorderSection(page.id, idx, idx - 1) }} disabled={idx === 0} className="rounded p-0.5 hover:bg-secondary disabled:opacity-20"><svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg></button>
                    <button onClick={(e) => { e.stopPropagation(); if (idx < page.sections.length - 1) onReorderSection(page.id, idx, idx + 1) }} disabled={idx === page.sections.length - 1} className="rounded p-0.5 hover:bg-secondary disabled:opacity-20"><svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg></button>
                    <button onClick={(e) => { e.stopPropagation(); onRemoveSectionFromPage(page.id, sec.id) }} className="rounded p-0.5 hover:bg-red-900/60 text-muted-foreground/60 hover:text-red-400"><svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                </div>
              )
            })}

            {newSection?.pageId === page.id && (
              <div className="mx-1 mt-1 flex items-center gap-1 rounded-md border border-amber-700/60 bg-muted px-2 py-1">
                <span className="text-[10px] font-bold font-mono text-orange-400 shrink-0 w-8">HTML</span>
                <input ref={newInputRef} value={newSection.name} onChange={(e) => { const cleaned = e.target.value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""); setNewSection({ ...newSection, name: cleaned }) }} onKeyDown={(e) => { if (e.key === "Enter") commitNewSection(page.id, newSection.name); if (e.key === "Escape") setNewSection(null) }} placeholder="hero_section" className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none font-mono" />
                <button onClick={() => commitNewSection(page.id, newSection.name)} className="text-amber-400 hover:text-amber-300"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></button>
                <button onClick={() => setNewSection(null)} className="text-muted-foreground/60 hover:text-muted-foreground"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
            )}
          </div>
        ))}

        <div className="mt-4 px-2">
          {newPage ? (
            <div className="flex items-center gap-1 rounded-md border border-amber-700/60 bg-muted px-2 py-1">
              <svg className="h-3 w-3 shrink-0 text-muted-foreground/60" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
              <input ref={newPageInputRef} value={newPage.name} onChange={(e) => setNewPage({ name: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") commitNewPage(newPage.name); if (e.key === "Escape") setNewPage(null) }} placeholder="page_id" className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none font-mono" />
              <button onClick={() => commitNewPage(newPage.name)} className="text-amber-400 hover:text-amber-300"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></button>
              <button onClick={() => setNewPage(null)} className="text-muted-foreground/60 hover:text-muted-foreground"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
          ) : (
            <button onClick={() => setNewPage({ name: "" })} className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 hover:text-amber-400 transition-colors">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
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
                <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                Library — not in any page
              </div>
              {unusedIds.map((id) => (
                <div key={id} className="group flex flex-col rounded-md hover:bg-muted transition-colors">
                  <div className="flex items-center gap-1.5 w-full px-2 py-1.5">
                    <button onClick={() => onSelect({ kind: "section", sectionTypeId: id, tab: "html" })} className={`flex items-center gap-1.5 flex-1 min-w-0 text-left text-xs ${isActiveSection(id) ? "text-amber-300" : "text-muted-foreground group-hover:text-foreground"}`}>
                      <span className="text-[10px] font-bold font-mono text-orange-400 shrink-0 w-8">HTML</span>
                      <span className="flex-1 truncate">{id}</span>
                    </button>
                    <button onClick={() => { if (!confirm(`Delete section type "${id}"?`)) return; onDeleteSectionType(id) }} className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-red-900/60 text-muted-foreground/60 hover:text-red-400 transition-colors shrink-0" title="Delete section type">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="flex gap-1 px-2 pb-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-muted-foreground/60 mr-1 self-center">Add to →</span>
                    {template.pages.map((p) => (
                      <button key={p.id} onClick={() => onAddSectionToPage(p.id, id)} className="rounded px-2 py-0.5 text-[10px] font-semibold bg-secondary text-foreground/80 hover:bg-amber-700 hover:text-white transition-colors uppercase tracking-wide">{p.id}</button>
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

function PreviewWithPageControl({ html, page }: { html: string; page: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(812)
  const isLoadedRef = useRef(false)
  const pageRef = useRef(page)
  pageRef.current = page

  useEffect(() => {
    const handler = (e: MessageEvent) => { if (e.data?.type === "memoriaResize" && typeof e.data.height === "number") setHeight(e.data.height) }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe || !html) return
    isLoadedRef.current = false; setHeight(812)
    const onLoad = () => { isLoadedRef.current = true; iframe.contentWindow?.postMessage({ type: "memoriaGoTo", pageId: pageRef.current }, "*") }
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
      <div className="relative overflow-hidden shrink-0" style={{ width: 391, borderRadius: "2.5rem", background: "#1a1a1a", border: "8px solid #111", outline: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 32px 64px rgba(0,0,0,0.4)" }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 rounded-b-xl" style={{ width: 120, height: 28, background: "#111" }} />
        <iframe ref={iframeRef} sandbox="allow-scripts" style={{ width: 375, height, display: "block", border: 0 }} title="Template Preview" />
      </div>
      <p className="text-xs text-muted-foreground pb-4">Live Preview — 375px</p>
    </div>
  )
}

// ─── Step 1: Details form ────────────────────────────────────────────────────

type FormState = { name: string; descriptionEn: string; descriptionIdn: string; price: string; priceAfterDiscount: string }
type UploadState = { mobileThumbnailKey: string; mobileThumbnailPreview: string; desktopThumbnailKey: string; desktopThumbnailPreview: string }
type FormErrors = Partial<Record<keyof FormState | "category" | "tags", string>>

// ─── Main component ───────────────────────────────────────────────────────────

export default function AddTemplate() {
  const navigate = useNavigate()

  // Step
  const [step, setStep] = useState<1 | 2>(1)

  // Step 1 state
  const [form, setForm] = useState<FormState>({ name: "", descriptionEn: "", descriptionIdn: "", price: "", priceAfterDiscount: "" })
  const [category, setCategory] = useState<SelectedItem>({ id: null, name: "" })
  const [tags, setTags] = useState<SelectedItem[]>([])
  const [uploads, setUploads] = useState<UploadState>({ mobileThumbnailKey: "", mobileThumbnailPreview: "", desktopThumbnailKey: "", desktopThumbnailPreview: "" })
  const [uploadingMobile, setUploadingMobile] = useState(false)
  const [uploadingDesktop, setUploadingDesktop] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState("")

  // Step 2 state (template maker)
  const [template, setTemplate] = useState<Template>(makeBlankTemplate)
  const [sectionTypes, setSectionTypes] = useState<Record<string, SectionTypeDef>>({})
  const [selection, setSelection] = useState<Selection>(null)
  const [previewPage, setPreviewPage] = useState("cover")
  const [themeJson, setThemeJson] = useState(JSON.stringify(makeBlankTemplate().theme_defaults, null, 2))
  const [schemaJson, setSchemaJson] = useState(JSON.stringify({ fields: [] }, null, 2))
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<"draft" | "active" | "inactive">("draft")

  const createMutation = useMutation({
    mutationFn: createInvitationTemplate,
    onSuccess: () => { navigate("/templates") },
    onError: () => { setSaving(false); setSubmitError("Failed to save template. Please try again.") },
  })

  // ── Form helpers ────────────────────────────────────────────────────────────

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const handleMobileUpload = async (file: File) => {
    setUploadingMobile(true)
    try { const r = await uploadObjectWithPresignedUrl(file, "invitation-template"); setUploads((u) => ({ ...u, mobileThumbnailKey: r.key, mobileThumbnailPreview: URL.createObjectURL(file) })) }
    catch { setSubmitError("Failed to upload mobile thumbnail.") }
    finally { setUploadingMobile(false) }
  }

  const handleDesktopUpload = async (file: File) => {
    setUploadingDesktop(true)
    try { const r = await uploadObjectWithPresignedUrl(file, "invitation-template"); setUploads((u) => ({ ...u, desktopThumbnailKey: r.key, desktopThumbnailPreview: URL.createObjectURL(file) })) }
    catch { setSubmitError("Failed to upload desktop thumbnail.") }
    finally { setUploadingDesktop(false) }
  }

  const validateStep1 = (): FormErrors => {
    const next: FormErrors = {}
    if (!form.name.trim()) next.name = "Template title is required"
    if (!uploads.mobileThumbnailKey) next.name = "Mobile thumbnail is required"
    if (!uploads.desktopThumbnailKey) next.name = "Desktop thumbnail is required"
    if (!category.name.trim()) next.category = "Category is required"
    if (tags.length === 0) next.tags = "At least one tag is required"
    return next
  }

  const handleNext = () => {
    setSubmitError("")
    const errs = validateStep1()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    // Update template name to match form
    setTemplate((t) => ({ ...t, name: form.name.trim() }))
    setStep(2)
  }

  // ── Template maker helpers ──────────────────────────────────────────────────

  const previewInvitation = useMemo<Invitation>(() => {
    let parsedTheme = template.theme_defaults
    try { parsedTheme = JSON.parse(themeJson) } catch { /* noop */ }
    const mainPage = template.pages.find((p) => p.id === "main")
    return { ...createDefaultInvitation(), theme: parsedTheme, sectionOrder: mainPage ? mainPage.sections.map((s) => s.id) : [] }
  }, [template, themeJson])

  const previewHtml = useMemo(() => renderInvitation(template, previewInvitation, sectionTypes), [template, previewInvitation, sectionTypes])

  const handleThemeJson = useCallback((v: string) => { setThemeJson(v); try { setTemplate((t) => ({ ...t, theme_defaults: JSON.parse(v) })) } catch { /* noop */ } }, [])
  const handleSchemaJson = useCallback((v: string) => { setSchemaJson(v); try { setTemplate((t) => ({ ...t, schema: JSON.parse(v) })) } catch { /* noop */ } }, [])
  const handleSectionCode = useCallback((id: string, field: CodeTab, value: string) => { setSectionTypes((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } })) }, [])
  const handleDeleteSectionType = useCallback((id: string) => { setSectionTypes((prev) => { const next = { ...prev }; delete next[id]; return next }); setSelection((s) => (s?.kind === "section" && s.sectionTypeId === id ? null : s)) }, [])
  const handleAddPage = useCallback((id: string, label: string) => { setTemplate((prev) => ({ ...prev, pages: [...prev.pages, { id, label, sections: [] }] })) }, [])
  const handleDeletePage = useCallback((id: string) => { setTemplate((prev) => ({ ...prev, pages: prev.pages.filter((p) => p.id !== id) })) }, [])
  const handleAddSectionType = useCallback((id: string) => {
    if (!id || sectionTypes[id]) return
    setSectionTypes((prev) => ({ ...prev, [id]: { id, html: `<section class="s-${id}">\n  <!-- ${id} -->\n</section>`, css: `.s-${id} {\n  padding: 4rem 2rem;\n  background: var(--color-background);\n}`, js: "", schema: { slots: [], styles: [] } } }))
    setSelection({ kind: "section", sectionTypeId: id, tab: "html" })
  }, [sectionTypes])
  const handleAddSectionToPage = useCallback((pageId: string, sectionTypeId: string) => {
    setTemplate((prev) => ({ ...prev, pages: prev.pages.map((p) => { if (p.id !== pageId || p.sections.find((s) => s.section_type_id === sectionTypeId)) return p; const s: SectionConfig = { id: `${sectionTypeId}_${Date.now()}`, section_type_id: sectionTypeId }; return { ...p, sections: [...p.sections, s] } }) }))
  }, [])
  const handleRemoveSectionFromPage = useCallback((pageId: string, sectionId: string) => { setTemplate((prev) => ({ ...prev, pages: prev.pages.map((p) => p.id !== pageId ? p : { ...p, sections: p.sections.filter((s) => s.id !== sectionId) }) })) }, [])
  const handleReorderSection = useCallback((pageId: string, fromIdx: number, toIdx: number) => {
    setTemplate((prev) => ({ ...prev, pages: prev.pages.map((p) => { if (p.id !== pageId) return p; const sections = [...p.sections]; const [moved] = sections.splice(fromIdx, 1); sections.splice(toIdx, 0, moved); return { ...p, sections } }) }))
  }, [])
  const handleTabChange = useCallback((tab: CodeTab) => { setSelection((s) => s?.kind === "section" ? { ...s, tab } : s) }, [])

  const handleSaveTemplate = () => {
    setSaving(true)
    setSubmitError("")

    const tagIds = tags.filter((t) => t.id !== null).map((t) => t.id as number)
    const newTags = tags.filter((t) => t.id === null).map((t) => t.name)

    const { id: _id, name: _name, ...templateBody } = template

    createMutation.mutate({
      name: form.name.trim(),
      ...(form.descriptionEn.trim() ? { descriptionEn: form.descriptionEn.trim() } : {}),
      ...(form.descriptionIdn.trim() ? { descriptionIdn: form.descriptionIdn.trim() } : {}),
      ...(uploads.mobileThumbnailKey ? { mobileThumbnail: uploads.mobileThumbnailKey } : {}),
      ...(uploads.desktopThumbnailKey ? { desktopThumbnail: uploads.desktopThumbnailKey } : {}),
      ...(category.id !== null ? { categoryId: category.id } : { newCategory: category.name.trim() }),
      ...(tagIds.length > 0 ? { tagIds } : {}),
      ...(newTags.length > 0 ? { newTags } : {}),
      ...(form.price ? { price: form.price } : {}),
      ...(form.priceAfterDiscount ? { priceAfterDiscount: form.priceAfterDiscount } : {}),
      version: 1,
      status: status as "draft" | "active" | "inactive",
      template: { ...templateBody, sectionTypes },
    })
  }

  const handlePreviewTemplate = () => {
    const win = window.open("", "_blank")
    if (win) { win.document.write(previewHtml); win.document.close() }
  }

  // ── STEP 1 UI ───────────────────────────────────────────────────────────────

  if (step === 1) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/templates")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-sm font-semibold text-foreground">Add New Template</h1>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">Step 1 of 2 — Details</span>
          </div>
          <button onClick={handleNext} disabled={uploadingMobile || uploadingDesktop} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-60">
            Next
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        <div className="mx-auto max-w-5xl px-6 py-8 space-y-8">
          {submitError && <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{submitError}</div>}

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Template Title <span className="text-destructive">*</span></label>
            <input type="text" value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. Javanese Elegant" autoFocus
              className={`w-full rounded-lg border px-4 py-2.5 text-sm text-foreground bg-background placeholder:text-muted-foreground focus:outline-none transition-colors ${errors.name ? "border-destructive" : "border-border focus:border-indigo-500"}`} />
            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="flex gap-6">
            <ImageUploader label="Mobile Thumbnail" previewUrl={uploads.mobileThumbnailPreview} uploading={uploadingMobile} onFileSelect={handleMobileUpload} error={errors.name && !uploads.mobileThumbnailKey ? "Mobile thumbnail is required" : undefined} />
            <ImageUploader label="Desktop Thumbnail" previewUrl={uploads.desktopThumbnailPreview} uploading={uploadingDesktop} onFileSelect={handleDesktopUpload} error={errors.name && !uploads.desktopThumbnailKey ? "Desktop thumbnail is required" : undefined} />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Template Category <span className="text-destructive">*</span><span className="ml-1.5 text-xs font-normal text-muted-foreground">— type to search or create</span></label>
              <CategoryCombobox value={category} onChange={(v) => { setCategory(v); setErrors((e) => ({ ...e, category: undefined })) }} error={errors.category} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Template Style (Tags) <span className="text-destructive">*</span><span className="ml-1.5 text-xs font-normal text-muted-foreground">— multiple allowed</span></label>
              <TagsCombobox value={tags} onChange={(v) => { setTags(v); setErrors((e) => ({ ...e, tags: undefined })) }} error={errors.tags} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <PriceInput label="Sell Price" value={form.price} onChange={(v) => setField("price", v)} />
            <PriceInput label="Before Discount Price" value={form.priceAfterDiscount} onChange={(v) => setField("priceAfterDiscount", v)} />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="mb-4 text-base font-semibold text-foreground">English</h3>
              <label className="mb-2 block text-sm font-medium text-foreground">Template Description</label>
              <textarea value={form.descriptionEn} onChange={(e) => setField("descriptionEn", e.target.value)} placeholder="Type the feature description (Max 50 words)" rows={8} className="w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <h3 className="mb-4 text-base font-semibold text-foreground">Indonesia</h3>
              <label className="mb-2 block text-sm font-medium text-foreground">Deskripsi Template</label>
              <textarea value={form.descriptionIdn} onChange={(e) => setField("descriptionIdn", e.target.value)} placeholder="Type the feature description (Max 50 words)" rows={8} className="w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 2 UI (Template Maker) ──────────────────────────────────────────────

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Back to details">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Templates</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm font-semibold text-foreground">{form.name}</span>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">Step 2 of 2 — Template Maker</span>
        </div>

        <div className="flex items-center gap-2">
          {submitError && <span className="text-xs text-destructive">{submitError}</span>}
          <select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "active" | "inactive")} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground hover:border-muted-foreground focus:border-indigo-500 focus:outline-none transition-colors">
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button onClick={handlePreviewTemplate} className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            Preview
          </button>
          <button onClick={handleSaveTemplate} disabled={saving} className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${saving ? "bg-muted text-muted-foreground" : "bg-amber-600 hover:bg-amber-500 text-white"}`}>
            {saving ? "Saving..." : "Save Template"}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col overflow-hidden">
          <FileTree template={template} sectionTypes={sectionTypes} selection={selection} onSelect={setSelection} onAddSectionType={handleAddSectionType} onAddSectionToPage={handleAddSectionToPage} onRemoveSectionFromPage={handleRemoveSectionFromPage} onReorderSection={handleReorderSection} onDeleteSectionType={handleDeleteSectionType} onAddPage={handleAddPage} onDeletePage={handleDeletePage} />
        </aside>

        <main className="flex flex-1 flex-col overflow-hidden bg-background">
          {selection === null ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground/40">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              <p className="text-sm">Select a file from the tree to edit</p>
            </div>
          ) : selection.kind === "section" ? (
            sectionTypes[selection.sectionTypeId]
              ? <SectionCodeEditor sectionType={sectionTypes[selection.sectionTypeId]} tab={selection.tab} onTabChange={handleTabChange} onChange={(field, val) => handleSectionCode(selection.sectionTypeId, field, val)} />
              : <div className="flex flex-1 items-center justify-center text-red-400 text-sm">Section type "{selection.sectionTypeId}" not found.</div>
          ) : selection.kind === "theme"
            ? <JsonEditor label="theme.json" value={themeJson} onChange={handleThemeJson} example={EXAMPLE_THEME} />
            : <JsonEditor label="schema.json" value={schemaJson} onChange={handleSchemaJson} example={EXAMPLE_SCHEMA} />
          }
        </main>

        <aside className="w-120 shrink-0 border-l border-border bg-card flex flex-col overflow-hidden">
          <div className="flex items-center gap-1 border-b border-border px-4 py-2 shrink-0">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mr-3">Live Preview</h2>
            {template.pages.map((p) => (
              <button key={p.id} onClick={() => setPreviewPage(p.id)} className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${previewPage === p.id ? "bg-amber-900/50 text-amber-300 ring-1 ring-amber-700" : "text-muted-foreground hover:bg-muted hover:text-foreground/80"}`}>{p.label}</button>
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
