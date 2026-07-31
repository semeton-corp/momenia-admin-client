import { useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteAdmin, getAdmins, type Admin } from "@/api/admins"
import { queryKeys } from "@/api/query-keys"
import { ApiError } from "@/api/http-client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatApiDateTime } from "@/utils/formatApiDate"

function getInitials(admin: Admin) {
  const name = admin.name.trim()

  if (name) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("")
  }

  return admin.email.slice(0, 2).toUpperCase()
}

export default function Admins() {
  const queryClient = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null)

  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.admins.lists(),
    queryFn: () => getAdmins(),
  })

  const admins = response?.data ?? []

  const deleteMutation = useMutation({
    mutationFn: deleteAdmin,
    onSuccess: () => {
      toast.success("Admin deleted successfully")
      queryClient.invalidateQueries({ queryKey: queryKeys.admins.all })
      setDeleteTarget(null)
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : "Failed to delete admin. Please try again."
      toast.error(message)
    },
  })

  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Admin Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage admin accounts that can access the CMS.</p>
        </div>
        <Link
          to="/admins/add"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          Add Admin
        </Link>
      </div>

      {isLoading && (
        <div className="rounded-lg border border-border overflow-hidden animate-pulse">
          <div className="h-12 bg-muted/50" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 border-t border-border bg-card" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center gap-3">
          <p className="text-sm text-muted-foreground">Failed to load admins.</p>
          <button onClick={() => refetch()} className="text-sm text-indigo-500 hover:text-indigo-400">
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && admins.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-sm text-muted-foreground">No admins found.</p>
          <Link to="/admins/add" className="mt-3 text-sm text-indigo-500 hover:text-indigo-400">
            Add your first admin -&gt;
          </Link>
        </div>
      )}

      {!isLoading && !isError && admins.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-sm font-semibold">Admin</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Created</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="border-b border-border hover:bg-muted/30 transition-colors last:border-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {admin.profilePicture && <AvatarImage src={admin.profilePicture} alt={admin.name || admin.email} />}
                          <AvatarFallback>{getInitials(admin)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{admin.name || "Unnamed admin"}</p>
                          <p className="truncate text-xs text-muted-foreground">ID: {admin.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{admin.email}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{formatApiDateTime(admin.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDeleteTarget(admin)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-foreground mb-2">Delete Admin</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Delete {deleteTarget.name || deleteTarget.email}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteMutation.isPending}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
