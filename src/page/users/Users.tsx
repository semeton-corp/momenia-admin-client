import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Search } from "lucide-react"
import { getCmsUsers, type CmsUser } from "@/api/cms/users"
import { queryKeys } from "@/api/query-keys"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { formatApiDateTime } from "@/utils/formatApiDate"

const PAGE_SIZE_OPTIONS = [10, 20, 50]

function getInitials(user: CmsUser) {
  const name = user.name.trim()

  if (name) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("")
  }

  return user.email.slice(0, 2).toUpperCase()
}

export default function Users() {
  const [keyword, setKeyword] = useState("")
  const [pageSize, setPageSize] = useState(10)
  const [cursor, setCursor] = useState("")
  const [cursorHistory, setCursorHistory] = useState<string[]>([])
  const debouncedKeyword = useDebouncedValue(keyword, 400)

  const queryParams = useMemo(
    () => ({
      keyword: debouncedKeyword.trim() || undefined,
      pageSize,
      cursor: cursor || undefined,
    }),
    [cursor, debouncedKeyword, pageSize],
  )

  const { data: response, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: queryKeys.cmsUsers.list(queryParams),
    queryFn: () => getCmsUsers(queryParams),
  })

  const users = response?.data ?? []
  const nextCursor = response?.nextCursor ?? ""

  useEffect(() => {
    setCursor("")
    setCursorHistory([])
  }, [debouncedKeyword, pageSize])

  const goNext = () => {
    if (!nextCursor) {
      return
    }

    setCursorHistory((history) => [...history, cursor])
    setCursor(nextCursor)
  }

  const goPrevious = () => {
    setCursorHistory((history) => {
      if (history.length === 0) {
        return history
      }

      const nextHistory = history.slice(0, -1)
      setCursor(history[history.length - 1] ?? "")

      return nextHistory
    })
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">User Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Search and inspect registered Momenia users.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Search user..."
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none"
            />
          </label>
          <select
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-indigo-500 focus:outline-none"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{size} rows</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-lg border border-border overflow-hidden animate-pulse">
          <div className="h-12 bg-muted/50" />
          {Array.from({ length: pageSize }).map((_, i) => (
            <div key={i} className="h-16 border-t border-border bg-card" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center gap-3">
          <p className="text-sm text-muted-foreground">Failed to load users.</p>
          <button onClick={() => refetch()} className="text-sm text-indigo-500 hover:text-indigo-400">
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && users.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-sm text-muted-foreground">No users found.</p>
        </div>
      )}

      {!isLoading && !isError && users.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Registered</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/30 transition-colors last:border-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {user.profilePicture && <AvatarImage src={user.profilePicture} alt={user.name || user.email} />}
                          <AvatarFallback>{getInitials(user)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{user.name || "Unnamed user"}</p>
                          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{user.phoneNumber || "-"}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{formatApiDateTime(user.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/users/${user.id}`}
                        className="inline-flex rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        View Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>{isFetching && !isLoading ? "Updating users..." : `${users.length} user(s) shown`}</p>
        <div className="flex items-center gap-2">
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
    </div>
  )
}
