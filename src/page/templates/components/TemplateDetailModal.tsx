"use client"

import * as React from "react"
import { type InvitationTemplate, updateInvitationTemplate } from "@/api/cms/invitation-templates"
import { Heart, Star, Smartphone, Monitor, Eye, X, ArrowLeft, ChevronDown, ChevronRight, Info } from "lucide-react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export type TemplateDetail = InvitationTemplate & {
  rating?: number
  reviewCount?: number
  tags?: Array<{ id: number; name: string }>
}

type Props = {
  open: boolean
  template: TemplateDetail | null
  onClose: () => void
  isLoading?: boolean
  onStatusChange?: () => void
}

const FEATURE_ADDONS = [
  { key: "instagramFilter", label: "Instagram Filter", price: 10000 },
  { key: "multiLanguage", label: "Multi Language", price: 10000 },
  { key: "galleryMomenia", label: "Gallery Momenia", price: 10000, expandable: true },
  { key: "customDomainLink", label: "Custom Domain Link", price: 10000 },
] as const

const DURATION_ADDONS = [
  { key: "basic2week", label: "Basic (2 weeks)", price: 0 },
  { key: "month3", label: "3 Months", price: 10000 },
  { key: "month6", label: "6 Months", price: 10000 },
  { key: "month8", label: "8 Months", price: 10000 },
] as const

function getCategoryName(category: TemplateDetail["category"]): string {
  if (!category) return ""
  if (typeof category === "string") return category
  return category.name
}

export function TemplateDetailModal({ open, template, onClose, isLoading, onStatusChange }: Props) {
  const navigate = useNavigate()
  const [view, setView] = React.useState<"mobile" | "desktop">("mobile")
  const [statusUpdating, setStatusUpdating] = React.useState(false)
  const [step, setStep] = React.useState<"detail" | "addons">("detail")
  const [isFavourite, setIsFavourite] = React.useState(false)
  const [_selectedFeatures, setSelectedFeatures] = React.useState<Set<string>>(new Set())
  const [selectedDuration, setSelectedDuration] = React.useState("basic2week")
  const [expandedAddon, setExpandedAddon] = React.useState<string | null>(null)
  // The modal's `template` prop comes from a query keyed separately from the
  // list query that `onStatusChange` invalidates, so it won't refresh itself
  // after a successful status update — track the new status locally instead
  // of waiting on a refetch that never comes.
  const [statusOverride, setStatusOverride] = React.useState<"draft" | "active" | "inactive" | null>(null)

  React.useEffect(() => {
    setView("mobile")
    setStep("detail")
    setIsFavourite(false)
    setSelectedFeatures(new Set())
    setSelectedDuration("basic2week")
    setExpandedAddon(null)
    setStatusOverride(null)
  }, [template?.id])

  if (!open) return null

  const toggleFeature = (key: string) => {
    setSelectedFeatures((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
        <div className="relative pointer-events-auto w-full max-w-4xl rounded-4xl bg-white p-5 shadow-2xl focus:outline-none max-h-[85vh] min-h-105 overflow-hidden flex flex-col">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-20 flex items-center justify-center rounded-full w-9 h-9 bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {(isLoading || !template) && (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-zinc-600">Loading template details...</p>
              </div>
            </div>
          )}

          {!isLoading && template && step === "detail" && (
            <div className="grid grid-cols-[2fr_3fr] overflow-hidden rounded-4xl h-full gap-0">
              {/* ── Left: Preview ── */}
              <div className="flex h-full flex-col items-center gap-4 bg-zinc-50 p-5 border-r border-zinc-100">
                {/* Phone / Desktop preview */}
                <div className="flex flex-1 w-full items-center justify-center">
                  {view === "mobile" ? (
                    <div
                      className="relative mx-auto"
                      style={{ width: "250px", aspectRatio: "270 / 526" }}
                    >
                      <div
                        className="absolute overflow-hidden"
                        style={{
                          left: "2.593%",
                          right: "2.593%",
                          top: "1.331%",
                          bottom: "1.331%",
                          borderRadius: "50px",
                        }}
                      >
                        {template.mobileThumbnail && (
                          <img
                            src={template.mobileThumbnail}
                            alt={template.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <svg className="pointer-events-none h-full w-full object-contain" viewBox="0 0 270 526" fill="none">
                        <defs>
                          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: "#1a1a1a", stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: "#1a1a1a", stopOpacity: 1 }} />
                          </linearGradient>
                        </defs>
                        <rect width="270" height="526" rx="50" fill="url(#gradient1)" />
                        <rect x="60" y="10" width="150" height="25" rx="12" fill="#1a1a1a" />
                      </svg>
                    </div>
                  ) : (
                    <div
                      className="relative w-full overflow-hidden rounded-lg ring-10 ring-zinc-800"
                      style={{ aspectRatio: "4 / 3" }}
                    >
                      {template.desktopThumbnail ? (
                        <img
                          src={template.desktopThumbnail}
                          alt={template.name}
                          className="h-full w-full object-cover"
                        />
                      ) : template.mobileThumbnail ? (
                        <img
                          src={template.mobileThumbnail}
                          alt={template.name}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                      <div className="pointer-events-none absolute -bottom-5 left-1/2 h-5 w-24 -translate-x-1/2 rounded-b bg-zinc-800" />
                    </div>
                  )}
                </div>

                {/* Mobile / Desktop toggle */}
                <div className="flex w-full gap-2">
                  <button
                    className={cn(
                      "flex-1 h-12.5 rounded-xl text-base font-medium transition-colors flex items-center justify-center gap-2",
                      view === "mobile"
                        ? "bg-indigo-100 text-foreground hover:bg-indigo-200"
                        : "bg-zinc-100 text-foreground hover:bg-zinc-200"
                    )}
                    onClick={() => setView("mobile")}
                  >
                    <Smartphone className="h-4 w-4" />
                    Mobile
                  </button>
                  <button
                    className={cn(
                      "flex-1 h-12.5 rounded-xl text-base font-medium transition-colors flex items-center justify-center gap-2",
                      view === "desktop"
                        ? "bg-indigo-100 text-foreground hover:bg-indigo-200"
                        : "bg-zinc-100 text-foreground hover:bg-zinc-200"
                    )}
                    onClick={() => setView("desktop")}
                  >
                    <Monitor className="h-4 w-4" />
                    Desktop
                  </button>
                </div>

                {/* Demo */}
                <button className="w-full h-12.5 rounded-xl border border-zinc-200 text-base text-foreground hover:bg-zinc-50 transition-colors font-medium flex items-center justify-center gap-2">
                  <Eye className="h-4 w-4" />
                  Demo
                </button>
              </div>

              {/* ── Right: Details ── */}
              <div className="flex h-full flex-col gap-4 p-6 overflow-y-auto">
                {/* Category badge */}
                <div>
                  <span className="inline-flex h-10 w-auto items-center justify-center rounded-lg border border-border bg-indigo-400 px-4 text-sm font-medium text-white shadow-md">
                    {getCategoryName(template.category) || "Template"}
                  </span>
                </div>

                {/* Title + heart */}
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-3xl font-bold leading-tight text-zinc-900">{template.name}</h2>
                  <button
                    type="button"
                    aria-label="Toggle favourite"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent transition-colors hover:bg-accent/80"
                    onClick={() => setIsFavourite(!isFavourite)}
                  >
                    <Heart
                      className={cn(
                        "h-5 w-5 transition-colors",
                        isFavourite ? "fill-red-500 text-red-500" : "text-zinc-300 hover:text-red-400"
                      )}
                    />
                  </button>
                </div>

                {/* Style chips / Tags */}
                <div className="flex flex-wrap gap-2">
                  {template.tags && template.tags.length > 0 ? (
                    template.tags.map((tag) => (
                      <span key={tag.id} className="rounded-[15px] border border-indigo-300 bg-indigo-50 px-6 py-1.5 text-sm font-medium text-foreground">
                        {tag.name}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-[15px] border border-indigo-300 bg-indigo-50 px-6 py-1.5 text-sm font-medium text-foreground">
                      {getCategoryName(template.category) || "Template"}
                    </span>
                  )}
                </div>

                {/* Rating */}
                {template.rating !== undefined && (
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-5 w-5",
                          i < (template.rating || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-zinc-200 text-zinc-200"
                        )}
                      />
                    ))}
                    <span className="text-sm text-zinc-500">({template.reviewCount || 0})</span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl font-bold text-primary">
                    Rp {template.priceAfterDiscount ? parseInt(template.priceAfterDiscount).toLocaleString("id-ID") : (template.price ? parseInt(template.price).toLocaleString("id-ID") : "0")}
                  </span>
                  {template.price && template.priceAfterDiscount && (
                    <span className="relative font-normal text-base text-zinc-400">
                      Rp {parseInt(template.price).toLocaleString("id-ID")}
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(to top left, transparent calc(50% - 1.5px), #df2225 50%, transparent calc(50% + 1.5px))",
                        }}
                      />
                    </span>
                  )}
                </div>

                {/* Description */}
                {template && (template.descriptionEn || template.descriptionIdn) && (
                  <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-zinc-200 p-4 text-sm leading-relaxed text-foreground bg-zinc-50">
                    <div className="whitespace-pre-wrap space-y-2">
                      {(() => {
                        const desc = template.descriptionEn || template.descriptionIdn
                        if (typeof desc === 'string') {
                          return desc.split('\n').map((line, i) => (
                            <p key={i} className={cn(
                              "mb-2",
                              line.startsWith("### ") && "text-xs font-bold text-foreground mt-3",
                              line.startsWith("**") && "font-semibold"
                            )}>
                              {line.replace(/^### /, "").replace(/\*\*/g, "")}
                            </p>
                          ))
                        }
                        return <p>No description available</p>
                      })()}
                    </div>
                  </div>
                )}

                {/* CTA */}
                {(() => {
                  const status = statusOverride ?? template.status?.toLowerCase()
                  const handleStatus = async (next: "draft" | "active" | "inactive") => {
                    if (next === "active" && status === "active") {
                      toast.info("Invitation already set to active")
                      onClose()
                      return
                    }
                    setStatusUpdating(true)
                    try {
                      const cat = template.category
                      await updateInvitationTemplate(template.id, {
                        name: template.name,
                        descriptionEn: template.descriptionEn,
                        descriptionIdn: template.descriptionIdn,
                        mobileThumbnail: (() => { const u = template.mobileThumbnail; if (!u) return undefined; const m = u.match(/invitation-template\/.+/); return m ? m[0] : u })(),
                        desktopThumbnail: (() => { const u = template.desktopThumbnail; if (!u) return undefined; const m = u.match(/invitation-template\/.+/); return m ? m[0] : u })(),
                        ...(cat ? (typeof cat === "string" ? { newCategory: cat } : { categoryId: cat.id }) : {}),
                        tagIds: template.tags?.filter((t) => t.id !== null).map((t) => t.id) ?? [],
                        price: template.price,
                        priceAfterDiscount: template.priceAfterDiscount,
                        version: template.version,
                        template: template.template,
                        status: next,
                      })
                      setStatusOverride(next)
                      toast.success(
                        next === "active" ? "Template activated successfully" :
                        next === "inactive" ? "Template inactivated successfully" :
                        "Template updated successfully"
                      )
                      onStatusChange?.()
                    } finally {
                      setStatusUpdating(false)
                    }
                  }
                  const editBtn = (
                    <button
                      className="flex-1 h-14 rounded-2xl bg-white border border-zinc-200 px-4 text-base font-semibold text-zinc-800 hover:bg-zinc-50 transition-colors disabled:opacity-60"
                      onClick={() => navigate(`/templates/edit?id=${template.id}`)}
                      disabled={statusUpdating}
                    >
                      Edit Template
                    </button>
                  )
                  // Already active from the start (i.e. as loaded, not just after an
                  // in-modal update) — the activate action has nothing to do here.
                  const activateBtn = (
                    <button
                      className="flex-1 h-14 rounded-2xl bg-indigo-600 px-4 text-base font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      onClick={() => handleStatus("active")}
                      disabled={statusUpdating || status === "active"}
                    >
                      {statusUpdating ? "Updating..." : status === "active" ? "Already Active" : "Activate Template"}
                    </button>
                  )
                  if (status === "active") return (
                    <div className="flex gap-3 shrink-0">
                      {activateBtn}
                      {editBtn}
                      <button
                        className="flex-1 h-14 rounded-2xl bg-red-600 px-4 text-base font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60"
                        onClick={() => handleStatus("inactive")}
                        disabled={statusUpdating}
                      >
                        {statusUpdating ? "Updating..." : "Inactivate Template"}
                      </button>
                    </div>
                  )
                  if (status === "inactive") return (
                    <div className="flex gap-3 shrink-0">
                      {activateBtn}
                      {editBtn}
                    </div>
                  )
                  // draft
                  return (
                    <div className="flex gap-3 shrink-0">
                      {activateBtn}
                      {editBtn}
                      <button
                        className="flex-1 h-14 rounded-2xl bg-red-600 px-4 text-base font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60"
                        onClick={() => handleStatus("inactive")}
                        disabled={statusUpdating}
                      >
                        {statusUpdating ? "Updating..." : "Delete"}
                      </button>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

          {template && step === "addons" && (
            <div className="flex flex-col overflow-hidden rounded-4xl h-full">
              {/* Header */}
              <div className="relative flex shrink-0 items-center justify-center border-b border-zinc-100 px-6 py-6">
                <button
                  type="button"
                  className="absolute left-6 flex items-center justify-center rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                  onClick={() => setStep("detail")}
                  aria-label="Back"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <h2 className="text-4xl font-bold text-zinc-900">Add Ons</h2>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Feature add ons */}
                <div>
                  <p className="mb-3 text-2xl text-zinc-900">Feature Add Ons</p>
                  <div className="space-y-2">
                    {FEATURE_ADDONS.map((addon) => {
                      const expandable = "expandable" in addon
                      const isExpanded = expandable && expandedAddon === addon.key
                      return (
                        <div key={addon.key} className="rounded-xl border border-indigo-300 bg-indigo-50">
                          <div
                            className={cn("flex h-20 cursor-pointer items-center px-4 transition-colors rounded-xl", !isExpanded && "hover:bg-indigo-100")}
                            onClick={() => {
                              toggleFeature(addon.key)
                              if (expandable) setExpandedAddon((prev) => (prev === addon.key ? null : addon.key))
                            }}
                          >
                            <div className="flex flex-1 items-center gap-1.5">
                              <span className="text-lg font-medium text-foreground">{addon.label}</span>
                              <Info className="h-5 w-5 shrink-0 text-indigo-400" />
                              {expandable && (
                                isExpanded
                                  ? <ChevronDown className="h-5 w-5 shrink-0 text-zinc-400" />
                                  : <ChevronRight className="h-5 w-5 shrink-0 text-zinc-400" />
                              )}
                            </div>
                            <span className="mr-3 text-lg font-medium text-foreground">
                              Rp {addon.price.toLocaleString("id-ID")}
                            </span>
                            <div className="h-5 w-5 rounded border-2 border-indigo-400" />
                          </div>

                          {isExpanded && (
                            <div className="flex gap-4 px-4 pb-4">
                              <div className="flex h-24 w-36 shrink-0 items-center justify-center rounded-lg bg-zinc-200">
                                <svg className="h-8 w-8 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <rect x="3" y="3" width="18" height="18" rx="2" />
                                  <circle cx="8.5" cy="8.5" r="1.5" />
                                  <path d="M21 15l-5-5L5 21" />
                                </svg>
                              </div>
                              <p className="text-sm font-normal leading-relaxed text-zinc-500">Gallery description here</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Duration add ons */}
                <div>
                  <p className="mb-3 text-2xl text-zinc-900">Duration Add Ons</p>
                  <div className="space-y-2">
                    {DURATION_ADDONS.map(({ key, label, price }) => (
                      <div
                        key={key}
                        className="flex cursor-pointer items-center gap-4 rounded-xl border border-indigo-300 bg-indigo-50 px-4 h-20 transition-colors hover:bg-indigo-100"
                        onClick={() => setSelectedDuration(key)}
                      >
                        <span className="flex-1 text-lg font-medium text-foreground">{label}</span>
                        <span className="text-lg font-medium text-foreground">
                          {price === 0 ? "Rp 0" : `Rp ${price.toLocaleString("id-ID")}`}
                        </span>
                        <div className={cn("h-5 w-5 rounded-full border-2", selectedDuration === key ? "border-indigo-400 bg-indigo-400" : "border-indigo-400")} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="shrink-0 border-t border-zinc-100 p-6">
                <button className="h-15 w-full rounded-xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white hover:bg-indigo-700 transition-colors">
                  Continue to Payment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}
