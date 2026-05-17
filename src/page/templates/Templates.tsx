import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  getInvitationTemplates,
  type InvitationTemplate,
  type InvitationTemplateStatus,
} from "@/api/cms/invitation-templates"
import { queryKeys } from "@/api/query-keys"

const STATUS_LABELS: Record<InvitationTemplateStatus, string> = {
  PUBLISHED: "Published",
  DRAFT: "Draft",
}

const STATUS_STYLES: Record<InvitationTemplateStatus, string> = {
  PUBLISHED: "bg-green-500 text-white",
  DRAFT: "bg-muted text-muted-foreground",
}

function PhoneMockup({ thumbnail }: { thumbnail: string | null }) {
  return (
    <div className="relative mx-auto w-full max-w-40">
      {/* Phone frame */}
      <div className="relative rounded-4xl border-[3px] border-foreground/80 bg-foreground/80 shadow-md overflow-hidden aspect-9/16">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 h-4 w-16 rounded-b-xl bg-foreground/80" />
        {/* Screen */}
        <div className="absolute inset-0.5 rounded-[17px] overflow-hidden bg-muted">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt="Template preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-muted">
              <svg className="h-8 w-8 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        {/* View Template overlay button */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-[80%]">
          <div className="rounded border border-foreground/30 bg-background/80 py-1 text-center text-[9px] font-medium text-foreground/70 backdrop-blur-sm">
            View Template
          </div>
        </div>
      </div>
    </div>
  )
}

function TemplateCard({ template, onClick }: { template: InvitationTemplate; onClick: () => void }) {
  const status = template.status ?? "DRAFT"
  const formattedDate = template.updatedAt
    ? new Date(template.updatedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null

  return (
    <div
      className="rounded-2xl border border-border bg-card p-3 flex flex-col gap-3 cursor-pointer hover:border-border/80 hover:shadow-sm transition-all"
      onClick={onClick}
    >
      <PhoneMockup thumbnail={template.mobileThumbnail} />
      <div className="text-center space-y-0.5 pb-1">
        <p className="font-semibold text-sm text-foreground truncate">{template.name}</p>
        {template.category && (
          <p className="text-xs text-muted-foreground">{template.category}</p>
        )}
        {formattedDate && (
          <p className="text-[10px] text-muted-foreground">Last modified {formattedDate}</p>
        )}
        <div className="pt-1">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[status as InvitationTemplateStatus] ?? STATUS_STYLES.DRAFT}`}>
            {STATUS_LABELS[status as InvitationTemplateStatus] ?? status}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function Templates() {
  const navigate = useNavigate()

  const [keyword, setKeyword] = useState("")
  const [sortField, setSortField] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const queryParams = {
    keyword: keyword || undefined,
    sortField,
    sortOrder,
    pageSize: 50,
  }

  const { data: templates = [], isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.invitationTemplates.lists(queryParams),
    queryFn: () => getInvitationTemplates(queryParams),
  })

  const handleCardClick = (template: InvitationTemplate) => {
    navigate(`/templates/maker?id=${template.id}`)
  }

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Template List</h1>
        <button
          onClick={() => navigate("/templates/add")}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add New Template
        </button>
      </div>

      {/* Search + Filter + Sort */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Cari..."
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground focus:border-indigo-500 focus:outline-none"
        >
          <option value="">Filter</option>
          <option value="createdAt">By Date</option>
          <option value="name">By Name</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground focus:border-indigo-500 focus:outline-none"
        >
          <option value="asc">Sort: Asc</option>
          <option value="desc">Sort: Desc</option>
        </select>
      </div>

      {/* States */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-3 animate-pulse">
              <div className="aspect-9/16 max-w-40 mx-auto rounded-4xl bg-muted mb-3" />
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
