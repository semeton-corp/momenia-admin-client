import { type InvitationTemplate } from "@/api/cms/invitation-templates";
import { Badge } from "@/components/ui/badge";
import { formatApiDateTime } from "@/utils/formatApiDate";
import { PhoneMockup } from "./PhoneMockup";
import {
  formatCategoryAndTagName,
  STATUS_LABELS,
  STATUS_STYLES,
} from "./constants";

export function TemplateCard({
  template,
  onClick,
}: {
  template: InvitationTemplate;
  onClick: () => void;
}) {
  const status = template.status ?? "draft";
  const formattedDate = formatApiDateTime(template.lastModifiedAt);

  return (
    <button
      type="button"
      className="group flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-3 text-left transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
      onClick={onClick}
    >
      <div className="flex justify-center rounded-lg bg-muted/40 py-3">
        <PhoneMockup thumbnail={template.mobileThumbnail} />
      </div>
      <div className="min-w-0 space-y-1 pb-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {template.name}
          </p>
          <Badge
            className={`rounded-md text-[10px] shrink-0 ${STATUS_STYLES[status] ?? STATUS_STYLES.draft}`}
          >
            {STATUS_LABELS[status] ?? status}
          </Badge>
        </div>
        {template.category && (
          <p className="truncate text-xs text-muted-foreground">
            {typeof template.category === "string"
              ? formatCategoryAndTagName(template.category)
              : formatCategoryAndTagName(template.category.name)}
          </p>
        )}
        {formattedDate !== "-" && (
          <p className="text-[10px] text-muted-foreground">
            Last modified {formattedDate}
          </p>
        )}
      </div>
    </button>
  );
}
