import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getLandingPageCatalogs, saveLandingPageCatalogsBatch, type LandingPageCatalog } from "@/api/cms/landing-page-catalogs"
import { queryKeys } from "@/api/query-keys"
import { cn } from "@/lib/utils"

const Catalogs = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: catalogs, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.landingPageCatalogs.lists(),
    queryFn: getLandingPageCatalogs,
  })

  const [localCatalogs, setLocalCatalogs] = useState<LandingPageCatalog[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (catalogs) {
      setLocalCatalogs(catalogs)
      setHasChanges(false)
    }
  }, [catalogs])

  const { mutate: saveBatch, isPending: isSaving, error: saveError } = useMutation({
    mutationFn: saveLandingPageCatalogsBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.landingPageCatalogs.all })
      setHasChanges(false)
    },
  })

  const toggleIsNew = (id: number) => {
    setLocalCatalogs((prev) =>
      prev.map((c) => c.id === id ? { ...c, isNew: !c.isNew } : c)
    )
    setHasChanges(true)
  }

  const handleApply = () => {
    saveBatch(
      localCatalogs.map((c) => ({
        id: c.id,
        invitationTemplateId: c.invitationTemplateId,
        isNew: c.isNew,
      }))
    )
  }

  const handleDiscard = () => {
    if (catalogs) {
      setLocalCatalogs(catalogs)
      setHasChanges(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background px-4 py-5 md:px-6">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-xl font-semibold tracking-normal">Catalog Momemia</h1>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <>
              {saveError && (
                <span className="text-xs text-destructive">
                  {saveError instanceof Error ? saveError.message : "Failed to save"}
                </span>
              )}
              <button
                type="button"
                onClick={handleDiscard}
                disabled={isSaving}
                className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-60"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={isSaving}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 transition-colors disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Apply Changes"}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => navigate("/landing/catalogs/select")}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
          >
            Edit Selected Templates
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-3 animate-pulse">
              <div className="aspect-9/18 rounded-xl bg-muted mb-2" />
              <div className="h-3 bg-muted rounded mx-auto w-3/4 mb-3" />
              <div className="h-8 bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-sm text-muted-foreground">Failed to load catalogs.</p>
          <button onClick={() => refetch()} className="text-sm text-indigo-500 hover:text-indigo-400">
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && localCatalogs.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-sm text-muted-foreground">No catalogs yet.</p>
          <button
            onClick={() => navigate("/landing/catalogs/select")}
            className="mt-3 text-sm text-indigo-500 hover:text-indigo-400"
          >
            Select templates →
          </button>
        </div>
      )}

      {!isLoading && !isError && localCatalogs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {localCatalogs.map((catalog) => (
            <div
              key={catalog.id}
              className={cn(
                "rounded-2xl border bg-card p-3 flex flex-col transition-colors",
                catalog.isNew !== catalogs?.find((c) => c.id === catalog.id)?.isNew
                  ? "border-amber-400"
                  : "border-border"
              )}
            >
              {/* Thumbnail */}
              <div className="aspect-9/18 rounded-xl overflow-hidden bg-muted mb-2">
                {catalog.invitationTemplateMobileThumbnail ? (
                  <img
                    src={catalog.invitationTemplateMobileThumbnail}
                    alt={catalog.invitationTemplateNameEn}
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

              {/* Name */}
              <p className="text-xs font-semibold text-foreground text-center truncate mb-2">
                {catalog.invitationTemplateNameEn}
              </p>

              {/* isNew toggle */}
              <div className="flex rounded-lg border border-border overflow-hidden text-xs font-medium mt-auto">
                <button
                  type="button"
                  onClick={() => !catalog.isNew && toggleIsNew(catalog.id)}
                  className={cn(
                    "flex-1 py-1.5 transition-colors",
                    catalog.isNew
                      ? "bg-indigo-500 text-white"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  New Template
                </button>
                <button
                  type="button"
                  onClick={() => catalog.isNew && toggleIsNew(catalog.id)}
                  className={cn(
                    "flex-1 py-1.5 transition-colors border-l border-border",
                    !catalog.isNew
                      ? "bg-indigo-500 text-white"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  Momenia's Choice
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

export default Catalogs
