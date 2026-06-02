import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getInvitationTemplates } from "@/api/cms/invitation-templates"
import { getLandingPageCatalogs, saveLandingPageCatalogsBatch } from "@/api/cms/landing-page-catalogs"
import { queryKeys } from "@/api/query-keys"
import { cn } from "@/lib/utils"

export default function CatalogTemplateSelect() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: templatesRes, isLoading: isLoadingTemplates } = useQuery({
    queryKey: queryKeys.invitationTemplates.lists({ pageSize: 200, statuses: ["active"], sortField: "createdAt", sortOrder: "desc" }),
    queryFn: () => getInvitationTemplates({ pageSize: 200, statuses: ["active"], sortField: "createdAt", sortOrder: "desc" }),
  })

  const { data: catalogs, isLoading: isLoadingCatalogs } = useQuery({
    queryKey: queryKeys.landingPageCatalogs.lists(),
    queryFn: getLandingPageCatalogs,
  })

  const templates = templatesRes?.data ?? []

  // Build initial selection from existing catalogs: templateId → catalog entry
  const existingByTemplateId = useMemo(() => {
    const map = new Map<string, { id: number; isNew: boolean }>()
    catalogs?.forEach((c) => map.set(c.invitationTemplateId, { id: c.id, isNew: c.isNew }))
    return map
  }, [catalogs])

  // selectedIds: set of invitationTemplateIds currently checked
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    return new Set(catalogs?.map((c) => c.invitationTemplateId) ?? [])
  })

  // Sync initial selection once catalogs load
  const [synced, setSynced] = useState(false)
  if (catalogs && !synced) {
    setSelectedIds(new Set(catalogs.map((c) => c.invitationTemplateId)))
    setSynced(true)
  }

  const toggleTemplate = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const { mutate: save, isPending: isSaving, error: saveError } = useMutation({
    mutationFn: () => {
      const items = Array.from(selectedIds).map((templateId) => {
        const existing = existingByTemplateId.get(templateId)
        return {
          ...(existing ? { id: existing.id } : {}),
          invitationTemplateId: templateId,
          isNew: existing?.isNew ?? false,
        }
      })
      return saveLandingPageCatalogsBatch(items)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.landingPageCatalogs.all })
      navigate("/landing/catalogs")
    },
  })

  const isLoading = isLoadingTemplates || isLoadingCatalogs

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/landing/catalogs")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-sm font-semibold text-foreground">Select Templates for Catalog</h1>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
            {selectedIds.size} selected
          </span>
        </div>
        <div className="flex items-center gap-3">
          {saveError && (
            <span className="text-xs text-destructive">
              {saveError instanceof Error ? saveError.message : "Failed to save"}
            </span>
          )}
          <button
            onClick={() => navigate("/landing/catalogs")}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => save()}
            disabled={isSaving}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Selection"}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4" />
              <p className="text-sm text-muted-foreground">Loading templates...</p>
            </div>
          </div>
        ) : templates.length === 0 ? (
          <div className="flex items-center justify-center py-32">
            <p className="text-sm text-muted-foreground">No active templates found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {templates.map((template) => {
              const isSelected = selectedIds.has(template.id)
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => toggleTemplate(template.id)}
                  className={cn(
                    "relative rounded-2xl border bg-card p-3 text-left transition-all",
                    "hover:border-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                    isSelected
                      ? "border-indigo-500 ring-2 ring-indigo-500/40"
                      : "border-border"
                  )}
                >
                  {/* Checkbox indicator */}
                  <div className={cn(
                    "absolute right-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded border-2 transition-colors",
                    isSelected
                      ? "border-indigo-500 bg-indigo-500"
                      : "border-zinc-300 bg-white"
                  )}>
                    {isSelected && (
                      <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div className="flex justify-center mb-2">
                    <div className="w-full aspect-9/18 rounded-xl overflow-hidden bg-muted">
                      {template.mobileThumbnail ? (
                        <img
                          src={template.mobileThumbnail}
                          alt={template.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground/30">
                          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <p className="text-xs font-medium text-foreground text-center truncate">{template.name}</p>
                  {template.category && (
                    <p className="text-[10px] text-muted-foreground text-center truncate mt-0.5">
                      {typeof template.category === "string" ? template.category : template.category.name}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
