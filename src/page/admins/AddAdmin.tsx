import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createAdminAccount } from "@/api/admins"
import { ApiError } from "@/api/http-client"
import { queryKeys } from "@/api/query-keys"

export default function AddAdmin() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")

  const createMutation = useMutation({
    mutationFn: createAdminAccount,
    onSuccess: () => {
      toast.success("Admin created successfully")
      queryClient.invalidateQueries({ queryKey: queryKeys.admins.all })
      navigate("/admins")
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : "Failed to create admin account. Please try again."
      setError(message)
      toast.error(message)
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email.trim()) {
      setError("Email is required")
      toast.error("Email is required")
      return
    }

    createMutation.mutate({ email: email.trim(), provider: "google" })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admins")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-sm font-semibold text-foreground">Add Admin</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-md px-6 py-8 space-y-6">
        {error && <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">Email <span className="text-destructive">*</span></label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@momenia.id"
            autoFocus
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none transition-colors"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            The account will sign in with Google using this email.
          </p>
        </div>

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-60"
        >
          {createMutation.isPending ? "Creating..." : "Create Admin"}
        </button>
      </form>
    </div>
  )
}
