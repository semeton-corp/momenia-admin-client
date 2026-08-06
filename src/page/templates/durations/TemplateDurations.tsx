import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getInvitationTemplateDurations,
  createInvitationTemplateDuration,
  updateInvitationTemplateDuration,
  deleteInvitationTemplateDuration,
  type InvitationTemplateDuration,
  type InvitationTemplateDurationPayload,
  type InvitationTemplateDurationUnit,
} from "@/api/cms/invitation-template-durations"
import { queryKeys } from "@/api/query-keys"
import { cn } from "@/lib/utils"

const UNIT_OPTIONS = ["day", "week", "month", "year"] as const

type DurationForm = {
  duration: string
  unit: InvitationTemplateDurationUnit
  price: string
  isActive: boolean
}

function formatPrice(raw: string): string {
  if (!raw) return ""
  return Number(raw).toLocaleString("id-ID")
}

const emptyForm = (): DurationForm => ({
  duration: "1",
  unit: "week",
  price: "",
  isActive: true,
})

type ModalMode = { type: "create" } | { type: "edit"; item: InvitationTemplateDuration }

export default function TemplateDurations() {
  const queryClient = useQueryClient()
  const [modal, setModal] = useState<ModalMode | null>(null)
  const [form, setForm] = useState<DurationForm>(emptyForm())
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [formError, setFormError] = useState("")

  const { data: durations = [], isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.invitationTemplateDurations.lists(),
    queryFn: getInvitationTemplateDurations,
  })

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: (payload: InvitationTemplateDurationPayload) => createInvitationTemplateDuration(payload),
    onSuccess: () => {
      toast.success("Duration created successfully")
      queryClient.invalidateQueries({ queryKey: queryKeys.invitationTemplateDurations.all })
      setModal(null)
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Failed to create duration"
      setFormError(message)
      toast.error(message)
    },
  })

  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: InvitationTemplateDurationPayload }) =>
      updateInvitationTemplateDuration(id, payload),
    onSuccess: () => {
      toast.success("Duration updated successfully")
      queryClient.invalidateQueries({ queryKey: queryKeys.invitationTemplateDurations.all })
      setModal(null)
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Failed to update duration"
      setFormError(message)
      toast.error(message)
    },
  })

  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => deleteInvitationTemplateDuration(id),
    onSuccess: () => {
      toast.success("Duration deleted successfully")
      queryClient.invalidateQueries({ queryKey: queryKeys.invitationTemplateDurations.all })
      setDeleteConfirmId(null)
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Failed to delete duration"
      toast.error(message)
    },
  })

  const openCreate = () => {
    setForm(emptyForm())
    setFormError("")
    setModal({ type: "create" })
  }

  const openEdit = (item: InvitationTemplateDuration) => {
    setForm({ duration: String(item.duration), unit: item.unit, price: item.price, isActive: item.isActive })
    setFormError("")
    setModal({ type: "edit", item })
  }

  const handleSubmit = () => {
    const duration = Number(form.duration)

    if (!form.duration || !Number.isInteger(duration) || duration < 1) {
      const message = "Duration must be at least 1"
      setFormError(message)
      toast.error(message)
      return
    }

    const price = Number(form.price)

    if (!form.price || !Number.isFinite(price) || price <= 0) {
      const message = "Price must be greater than 0"
      setFormError(message)
      toast.error(message)
      return
    }

    setFormError("")
    const payload: InvitationTemplateDurationPayload = {
      duration,
      unit: form.unit,
      price: String(price),
      isActive: form.isActive,
    }

    if (modal?.type === "edit") {
      update({ id: modal.item.id, payload })
    } else {
      create(payload)
    }
  }

  const isSaving = isCreating || isUpdating

  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Template Durations</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Duration
        </button>
      </div>

      {isLoading && (
        <div className="rounded-lg border border-border overflow-hidden animate-pulse">
          <div className="h-12 bg-muted/50" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 border-t border-border bg-card" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center gap-3">
          <p className="text-sm text-muted-foreground">Failed to load durations.</p>
          <button onClick={() => refetch()} className="text-sm text-indigo-500 hover:text-indigo-400">
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && durations.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-sm text-muted-foreground">No durations yet.</p>
          <button onClick={openCreate} className="mt-3 text-sm text-indigo-500 hover:text-indigo-400">
            Add your first duration →
          </button>
        </div>
      )}

      {!isLoading && !isError && durations.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-semibold">Duration</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Unit</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Price</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {durations.map((item) => (
                <tr key={item.id} className="border-b border-border hover:bg-muted/30 transition-colors last:border-0">
                  <td className="px-6 py-4 text-sm font-medium">{item.duration}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground capitalize">{item.unit}</td>
                  <td className="px-6 py-4 text-sm">Rp {formatPrice(item.price)}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      item.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    )}>
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-foreground mb-5">
              {modal.type === "create" ? "Add Duration" : "Edit Duration"}
            </h2>

            {formError && (
              <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Duration</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.duration}
                    onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value.replace(/\D/g, "") }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Unit</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value as InvitationTemplateDurationUnit }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-indigo-500 focus:outline-none"
                  >
                    {UNIT_OPTIONS.map((d) => (
                      <option key={d} value={d} className="capitalize">{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value.replace(/\D/g, "") }))}
                    placeholder="0"
                    className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm text-foreground focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Active</p>
                  <p className="text-xs text-muted-foreground">Make this duration available to users</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors",
                    form.isActive ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-600"
                  )}
                >
                  <span className={cn(
                    "absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform",
                    form.isActive ? "translate-x-5" : "translate-x-0"
                  )} />
                </button>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setModal(null)}
                disabled={isSaving}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-60"
              >
                {isSaving ? "Saving..." : modal.type === "create" ? "Create" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-foreground mb-2">Delete Duration</h2>
            <p className="text-sm text-muted-foreground mb-6">Are you sure you want to delete this duration? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={() => remove(deleteConfirmId)}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
