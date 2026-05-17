import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { getInvitationTemplates, type InvitationTemplate } from "@/api/cms/invitation-templates"
import { queryKeys } from "@/api/query-keys"
import { TemplatesHeader, TemplatesFilters, TemplateCard } from "./components"

export default function Templates() {
  const navigate = useNavigate()

  const [keyword, setKeyword] = useState("")
  const [sortField, setSortField] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [selectedStatuses, setSelectedStatuses] = useState<("draft" | "active" | "inactive")[]>(["draft", "active"])

  const queryParams = {
    keyword: keyword || undefined,
    sortField,
    sortOrder,
    pageSize: 50,
    statuses: selectedStatuses,
  }

  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.invitationTemplates.lists(queryParams),
    queryFn: () => getInvitationTemplates(queryParams),
  })

  const templates = response?.data ?? []

  const handleCardClick = (template: InvitationTemplate) => {
    navigate(`/templates/maker?id=${template.id}`)
  }

  return (
    <div className="px-6 py-8">
      <TemplatesHeader templates={templates} />

      <TemplatesFilters
        keyword={keyword}
        setKeyword={setKeyword}
        sortField={sortField}
        setSortField={setSortField}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        selectedStatuses={selectedStatuses}
        setSelectedStatuses={setSelectedStatuses}
      />

      {/* Debug */}
      <div className="mb-4 p-2 bg-muted rounded text-xs text-muted-foreground">
        Loading: {String(isLoading)} | Error: {String(isError)} | Count: {templates.length}
      </div>

      {/* States */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-3 animate-pulse h-full flex flex-col gap-3">
              <div className="flex justify-center">
                <div className="w-32 aspect-9/18 rounded-4xl bg-muted" />
              </div>
              <div className="space-y-2 pb-1">
                <div className="h-3 bg-muted rounded mx-auto w-3/4" />
                <div className="h-3 bg-muted rounded mx-auto w-1/2" />
                <div className="h-4 bg-muted rounded-full mx-auto w-16 mt-2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center gap-3">
          <p className="text-sm text-muted-foreground">Failed to load templates.</p>
          <button
            onClick={() => refetch()}
            className="text-sm text-indigo-500 hover:text-indigo-400"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && templates.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-sm text-muted-foreground">No templates found.</p>
          <button
            onClick={() => navigate("/templates/add")}
            className="mt-3 text-sm text-indigo-500 hover:text-indigo-400"
          >
            Add your first template →
          </button>
        </div>
      )}

      {!isLoading && !isError && templates.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onClick={() => handleCardClick(template)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
