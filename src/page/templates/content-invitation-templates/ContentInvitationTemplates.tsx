import { useRef, useState } from "react"
import { Copy, ImagePlus, Plus, RefreshCw, Trash2, Upload, X } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createContentInvitationTemplate,
  deleteContentInvitationTemplate,
  getContentInvitationTemplates,
  type ContentInvitationTemplate,
} from "@/api/cms/content-invitation-templates"
import { uploadObjectWithPresignedUrl } from "@/api/objects"
import { queryKeys } from "@/api/query-keys"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { formatApiDate } from "@/utils/formatApiDate"

type CreatePayload = {
  name: string
  file: File
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export default function ContentInvitationTemplates() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [name, setName] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [formError, setFormError] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<ContentInvitationTemplate | null>(null)

  const {
    data: templates = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.contentInvitationTemplates.lists(),
    queryFn: getContentInvitationTemplates,
  })

  const resetCreateForm = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setName("")
    setFile(null)
    setPreviewUrl("")
    setFormError("")
  }

  const closeCreate = () => {
    setIsCreateOpen(false)
    resetCreateForm()
  }

  const createMutation = useMutation({
    mutationFn: async ({ name: templateName, file: imageFile }: CreatePayload) => {
      const uploaded = await uploadObjectWithPresignedUrl(imageFile, "content-invitation-template")

      return createContentInvitationTemplate({
        name: templateName,
        content: uploaded.key,
      })
    },
    onSuccess: async () => {
      toast.success("Content invitation template created")
      await queryClient.invalidateQueries({ queryKey: queryKeys.contentInvitationTemplates.all })
      closeCreate()
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Failed to create content invitation template")
      setFormError(message)
      toast.error(message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteContentInvitationTemplate(id),
    onSuccess: async () => {
      toast.success("Content invitation template deleted")
      await queryClient.invalidateQueries({ queryKey: queryKeys.contentInvitationTemplates.all })
      setDeleteTarget(null)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to delete content invitation template"))
    },
  })

  const handleFileSelect = (selectedFile: File | undefined) => {
    if (!selectedFile) return

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setFile(selectedFile)
    setPreviewUrl(URL.createObjectURL(selectedFile))
    setFormError("")
  }

  const handleCreate = () => {
    const trimmedName = name.trim()

    if (!trimmedName) {
      setFormError("Template name is required")
      return
    }

    if (!file) {
      setFormError("Image file is required")
      return
    }

    setFormError("")
    createMutation.mutate({ name: trimmedName, file })
  }

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success("URL copied")
    } catch {
      toast.error("Could not copy URL")
    }
  }

  const isSaving = createMutation.isPending
  const isDeleting = deleteMutation.isPending

  return (
    <main className="min-h-[calc(100vh-4rem)] px-4 py-6 md:px-6 lg:px-7">
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.03em] text-foreground">Content Invitation Templates</h1>
            <p className="mt-1 text-sm text-muted-foreground">Upload reusable invitation content images and copy their public URLs.</p>
          </div>

          <Button type="button" onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-4" />
            Add Content Invitation Template
          </Button>
        </div>

        {isLoading && <TemplatesSkeleton />}

        {isError && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
            <p className="text-sm text-muted-foreground">Failed to load content invitation templates.</p>
            <Button type="button" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </div>
        )}

        {!isLoading && !isError && templates.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ImagePlus className="size-6" />
            </div>
            <p className="text-sm font-medium text-foreground">No content templates yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Upload the first image to make it available for copying.</p>
            <Button type="button" className="mt-4" onClick={() => setIsCreateOpen(true)}>
              <Plus className="size-4" />
              Add Content Invitation Template
            </Button>
          </div>
        )}

        {!isLoading && !isError && templates.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onCopy={handleCopy}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            aria-label="Close create dialog"
            onClick={closeCreate}
          />
          <section className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Add content template</h2>
                <p className="mt-1 text-sm text-muted-foreground">Upload one image and name it for the CMS library.</p>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" onClick={closeCreate} aria-label="Close">
                <X className="size-4" />
              </Button>
            </div>

            {formError && (
              <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                {formError}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="content-template-name">Name</Label>
                <Input
                  id="content-template-name"
                  value={name}
                  placeholder="e.g. Alya holding go book"
                  onChange={(event) => {
                    setName(event.target.value)
                    setFormError("")
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Image</Label>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-background transition-colors hover:border-muted-foreground/50",
                    isSaving && "cursor-not-allowed opacity-70",
                  )}
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Selected content template" className="h-full w-full object-contain" />
                  ) : (
                    <span className="flex flex-col items-center gap-3 px-6 text-center">
                      <Upload className="size-9 text-muted-foreground/50" />
                      <span>
                        <span className="block text-sm font-medium text-foreground">Choose image file</span>
                        <span className="mt-1 block text-xs text-muted-foreground">PNG, JPG, or WEBP</span>
                      </span>
                    </span>
                  )}
                  {previewUrl && !isSaving && (
                    <span className="absolute bottom-3 right-3 rounded-md bg-background/90 px-2 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
                      Replace
                    </span>
                  )}
                  {isSaving && (
                    <span className="absolute inset-0 flex items-center justify-center bg-background/70">
                      <span className="size-6 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
                    </span>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    handleFileSelect(event.target.files?.[0])
                    event.target.value = ""
                  }}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" disabled={isSaving} onClick={closeCreate}>
                Cancel
              </Button>
              <Button type="button" className="flex-1" disabled={isSaving} onClick={handleCreate}>
                {isSaving ? "Saving..." : "Create"}
              </Button>
            </div>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            aria-label="Close delete dialog"
            onClick={() => setDeleteTarget(null)}
          />
          <section className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-foreground">Delete template</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Delete "{deleteTarget.name}" from the content invitation template list?
            </p>
            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" disabled={isDeleting} onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                disabled={isDeleting}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

function TemplatesSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="aspect-[4/3] animate-pulse bg-muted" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-8 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

function TemplateCard({
  template,
  onCopy,
  onDelete,
}: {
  template: ContentInvitationTemplate
  onCopy: (url: string) => void
  onDelete: (template: ContentInvitationTemplate) => void
}) {
  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-muted-foreground/40">
      <div className="relative aspect-[4/3] bg-muted">
        <img
          src={template.content}
          alt={template.name}
          className="h-full w-full object-contain"
          loading="lazy"
        />
        <div className="absolute right-3 top-3 flex gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <Button
            type="button"
            size="icon-sm"
            variant="secondary"
            className="bg-background text-foreground shadow-sm hover:bg-background"
            onClick={() => onCopy(template.content)}
            aria-label={`Copy URL for ${template.name}`}
          >
            <Copy className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="destructive"
            className="shadow-sm"
            onClick={() => onDelete(template)}
            aria-label={`Delete ${template.name}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 p-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground" title={template.name}>
            {template.name}
          </h2>
          <p className="mt-0.5 text-[10px] text-muted-foreground">{formatApiDate(template.createdAt)}</p>
        </div>

        <button
          type="button"
          onClick={() => onCopy(template.content)}
          className="flex h-8 w-full items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-left text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          title={template.content}
        >
          <span className="min-w-0 flex-1 truncate">{template.content}</span>
          <Copy className="size-3 shrink-0" />
        </button>
      </div>
    </article>
  )
}
