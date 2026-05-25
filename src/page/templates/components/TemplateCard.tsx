import { type InvitationTemplate } from "@/api/cms/invitation-templates"
import { PhoneMockup } from "./PhoneMockup"
import { STATUS_LABELS, STATUS_STYLES } from "./constants"

export function TemplateCard({ template, onClick }: { template: InvitationTemplate; onClick: () => void }) {
  const status = template.status ?? "draft"
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
      className="rounded-2xl border border-border bg-card p-3 flex flex-col gap-3 cursor-pointer hover:border-border/80 hover:shadow-sm transition-all h-full"
      onClick={onClick}
    >
      <div className="flex justify-center">
        <PhoneMockup thumbnail={template.mobileThumbnail} />
      </div>
      <div className="text-center space-y-0.5 pb-1">
        <p className="font-semibold text-sm text-foreground truncate">{template.name}</p>
        {template.category && (
          <p className="text-xs text-muted-foreground">
            {typeof template.category === "string" ? template.category : template.category.name}
          </p>
        )}
        {formattedDate && (
          <p className="text-[10px] text-muted-foreground">Last modified {formattedDate}</p>
        )}
        <div className="pt-1">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[status] ?? STATUS_STYLES.draft}`}>
            {STATUS_LABELS[status] ?? status}
          </span>
        </div>
      </div>
    </div>
  )
}
