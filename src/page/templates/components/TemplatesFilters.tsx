export function TemplatesFilters({
  keyword,
  setKeyword,
  sortField,
  setSortField,
  sortOrder,
  setSortOrder,
  selectedStatuses,
  setSelectedStatuses,
}: {
  keyword: string
  setKeyword: (v: string) => void
  sortField: string
  setSortField: (v: string) => void
  sortOrder: "asc" | "desc"
  setSortOrder: (v: "asc" | "desc") => void
  selectedStatuses: ("draft" | "active" | "inactive")[]
  setSelectedStatuses: (v: ("draft" | "active" | "inactive")[]) => void
}) {
  return (
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

      <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2">
        <span className="text-sm text-muted-foreground">Status:</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedStatuses.includes("draft")}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedStatuses([...selectedStatuses, "draft"])
              } else {
                setSelectedStatuses(selectedStatuses.filter((s) => s !== "draft"))
              }
            }}
            className="rounded border-border"
          />
          <span className="text-sm text-foreground">Draft</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedStatuses.includes("active")}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedStatuses([...selectedStatuses, "active"])
              } else {
                setSelectedStatuses(selectedStatuses.filter((s) => s !== "active"))
              }
            }}
            className="rounded border-border"
          />
          <span className="text-sm text-foreground">Active</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selectedStatuses.includes("inactive")}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedStatuses([...selectedStatuses, "inactive"])
              } else {
                setSelectedStatuses(selectedStatuses.filter((s) => s !== "inactive"))
              }
            }}
            className="rounded border-border"
          />
          <span className="text-sm text-foreground">Inactive</span>
        </label>
      </div>
    </div>
  )
}
