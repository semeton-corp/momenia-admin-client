import { useQuery } from "@tanstack/react-query"
import { getInvitationTemplates } from "@/api/cms/invitation-templates"
import { queryKeys } from "@/api/query-keys"

export default function TemplateReport() {
  const sortField = "createdAt"
  const sortOrder: "asc" | "desc" = "desc"

  const queryParams = {
    sortField,
    sortOrder,
    pageSize: 100,
  }

  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.invitationTemplates.lists(queryParams),
    queryFn: () => getInvitationTemplates(queryParams),
  })

  const templates = response?.data ?? []

  const getStatusLabel = (status: string | undefined) => {
    if (status === "PUBLISHED") return "active"
    if (status === "DRAFT") return "draft"
    return status ?? "inactive"
  }

  const stats = {
    total: templates.length,
    draft: templates.filter((t) => getStatusLabel(t.status) === "draft").length,
    active: templates.filter((t) => getStatusLabel(t.status) === "active").length,
    inactive: templates.filter((t) => getStatusLabel(t.status) === "inactive").length,
  }

  if (isLoading) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold mb-8">Template Report</h1>
        <div className="text-muted-foreground">Loading report...</div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-2xl font-bold mb-8">Template Report</h1>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center gap-3">
          <p className="text-sm text-muted-foreground">Failed to load report.</p>
          <button
            onClick={() => refetch()}
            className="text-sm text-indigo-500 hover:text-indigo-400"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-bold mb-8">Template Report</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">Total Templates</div>
          <div className="text-3xl font-bold mt-2">{stats.total}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">Draft</div>
          <div className="text-3xl font-bold mt-2 text-gray-500">{stats.draft}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">Active</div>
          <div className="text-3xl font-bold mt-2 text-green-500">{stats.active}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">Inactive</div>
          <div className="text-3xl font-bold mt-2 text-red-500">{stats.inactive}</div>
        </div>
      </div>

      {/* Templates Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Created</th>
              <th className="px-6 py-4 text-left text-sm font-semibold">Last Modified</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => (
              <tr key={template.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 text-sm font-medium">{template.name}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {!template.category
                    ? "—"
                    : typeof template.category === "string"
                    ? template.category
                    : template.category.name}
                </td>
                <td className="px-6 py-4 text-sm">
                  {(() => {
                    const label = getStatusLabel(template.status)
                    return (
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          label === "draft"
                            ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            : label === "active"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {label}
                      </span>
                    )
                  })()}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {template.createdAt
                    ? new Date(template.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {template.updatedAt
                    ? new Date(template.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
