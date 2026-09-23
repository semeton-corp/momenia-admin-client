import {
  ArrowDownAZ,
  CalendarArrowDown,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type TemplateStatus = "draft" | "active" | "inactive";

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
  keyword: string;
  setKeyword: (v: string) => void;
  sortField: string;
  setSortField: (v: string) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (v: "asc" | "desc") => void;
  selectedStatuses: TemplateStatus[];
  setSelectedStatuses: (v: TemplateStatus[]) => void;
}) {
  const toggleStatus = (status: TemplateStatus) => {
    setSelectedStatuses(
      selectedStatuses.includes(status)
        ? selectedStatuses.filter((item) => item !== status)
        : [...selectedStatuses, status],
    );
  };

  return (
    <section
      aria-label="Template filters"
      className="mb-6 rounded-xl border border-border bg-card/60 p-3 shadow-xs"
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <label className="sr-only" htmlFor="template-search">
            Search templates
          </label>
          <input
            id="template-search"
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search templates by name"
            className="h-10 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-[border-color,box-shadow] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={sortField} onValueChange={setSortField}>
            <SelectTrigger aria-label="Sort field" className="w-full sm:w-36">
              <CalendarArrowDown className="size-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="createdAt">Time</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortOrder}
            onValueChange={(value) => setSortOrder(value as "asc" | "desc")}
          >
            <SelectTrigger aria-label="Sort order" className="w-full sm:w-40">
              <ArrowDownAZ className="size-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3"
        role="group"
        aria-label="Filter by status"
      >
        <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <SlidersHorizontal className="size-3.5" />
          Status
        </span>
        {(["draft", "active", "inactive"] as const).map((status) => {
          const selected = selectedStatuses.includes(status);
          return (
            <button
              key={status}
              type="button"
              aria-pressed={selected}
              onClick={() => toggleStatus(status)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {status}
            </button>
          );
        })}
      </div>
    </section>
  );
}
