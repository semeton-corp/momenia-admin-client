import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { getCmsUserDetail, type CmsUserDetail } from "@/api/cms/users"
import { queryKeys } from "@/api/query-keys"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { formatApiDateTime } from "@/utils/formatApiDate"

const TEMPLATE_HISTORY_PAGE_SIZE = 5

function getInitials(user?: CmsUserDetail) {
  const name = user?.name.trim()

  if (name) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("")
  }

  if (user?.email) {
    return user.email.slice(0, 2).toUpperCase()
  }

  return "US"
}

function statusClass(status: string) {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
    case "draft":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
    case "inactive":
      return "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export default function UserDetail() {
  const { id } = useParams()
  const [templateCursor, setTemplateCursor] = useState("")
  const [cursorHistory, setCursorHistory] = useState<string[]>([])

  const queryParams = useMemo(
    () => ({
      pageSize: TEMPLATE_HISTORY_PAGE_SIZE,
      cursor: templateCursor || undefined,
    }),
    [templateCursor],
  )

  const { data: user, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: queryKeys.cmsUsers.detail(id ?? "", queryParams),
    queryFn: () => getCmsUserDetail(id!, queryParams),
    enabled: Boolean(id),
  })

  const templates = user?.templates.data ?? []
  const nextCursor = user?.templates.nextCursor ?? ""

  const goNext = () => {
    if (!nextCursor) {
      return
    }

    setCursorHistory((history) => [...history, templateCursor])
    setTemplateCursor(nextCursor)
  }

  const goPrevious = () => {
    setCursorHistory((history) => {
      if (history.length === 0) {
        return history
      }

      const nextHistory = history.slice(0, -1)
      setTemplateCursor(history[history.length - 1] ?? "")

      return nextHistory
    })
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Link to="/users" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to users
          </Link>
          <h1 className="text-xl font-semibold text-foreground">User</h1>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="h-20 w-20 rounded-full bg-muted" />
          <div className="h-20 rounded-xl border border-border bg-card" />
          <div className="h-56 rounded-xl border border-border bg-card" />
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center gap-3">
          <p className="text-sm text-muted-foreground">Failed to load user detail.</p>
          <button onClick={() => refetch()} className="text-sm text-indigo-500 hover:text-indigo-400">
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && user && (
        <div className="space-y-6">
          <div className="flex min-h-24 items-center">
            <Avatar className="h-20 w-20">
              {user.profilePicture && <AvatarImage src={user.profilePicture} alt={user.name || user.email} />}
              <AvatarFallback className="text-lg">{getInitials(user)}</AvatarFallback>
            </Avatar>
          </div>

          <section className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-sm md:grid-cols-5">
            <div>
              <p className="text-sm font-semibold text-foreground">User Email</p>
              <p className="mt-1 break-all text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Registration Date</p>
              <p className="mt-1 text-sm text-muted-foreground">{formatApiDateTime(user.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Whatsapp Number</p>
              <p className="mt-1 text-sm text-muted-foreground">{user.phoneNumber || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Total Purchased</p>
              <p className="mt-1 text-sm text-muted-foreground">{user.totalPurchased}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Active Template</p>
              <p className="mt-1 text-sm text-muted-foreground">{user.activeTemplate}</p>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-sm font-semibold text-foreground">Template History</h2>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold">Template Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">Purchased Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold">Invitation Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.length === 0 ? (
                      <tr>
                        <td className="px-4 py-10 text-center text-sm text-muted-foreground" colSpan={4}>
                          No template history found.
                        </td>
                      </tr>
                    ) : templates.map((template) => (
                      <tr key={template.id} className="border-b border-border hover:bg-muted/30 transition-colors last:border-0">
                        <td className="px-4 py-3 text-sm text-foreground">{template.name || "Untitled template"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatApiDateTime(template.purchasedAt)}</td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", statusClass(template.status))}>
                            {template.status || "unknown"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {template.slug ? (
                            <a
                              href={`/${template.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-foreground underline-offset-4 hover:underline"
                            >
                              Invitation Link
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>{isFetching && !isLoading ? "Updating template history..." : `${templates.length} template(s) shown`}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs">Rows per page {TEMPLATE_HISTORY_PAGE_SIZE}</span>
                <button
                  onClick={goPrevious}
                  disabled={cursorHistory.length === 0 || isFetching}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={goNext}
                  disabled={!nextCursor || isFetching}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
