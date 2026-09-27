"use client";

import {
  type InvitationTemplate,
  updateInvitationTemplate,
} from "@/api/cms/invitation-templates";
import { cn } from "@/lib/utils";
import { Monitor, Smartphone, Star, X } from "lucide-react";
import * as React from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatCategoryAndTagName } from "./constants";
import { PhoneMockup } from "./PhoneMockup";

export type TemplateDetail = InvitationTemplate & {
  rating?: number;
  reviewCount?: number;
  tags?: Array<{ id: number; name: string }>;
};

type Props = {
  open: boolean;
  template: TemplateDetail | null;
  onClose: () => void;
  isLoading?: boolean;
  onStatusChange?: () => void;
};

function getCategoryName(category: TemplateDetail["category"]): string {
  if (!category) return "";
  if (typeof category === "string") return formatCategoryAndTagName(category);
  return formatCategoryAndTagName(category.name);
}

export function TemplateDetailModal({
  open,
  template,
  onClose,
  isLoading,
  onStatusChange,
}: Props) {
  const navigate = useNavigate();
  const [view, setView] = React.useState<"mobile" | "desktop">("mobile");
  const [statusUpdating, setStatusUpdating] = React.useState(false);
  // The modal's `template` prop comes from a query keyed separately from the
  // list query that `onStatusChange` invalidates, so it won't refresh itself
  // after a successful status update — track the new status locally instead
  // of waiting on a refetch that never comes.
  const [statusOverride, setStatusOverride] = React.useState<
    "draft" | "active" | "inactive" | null
  >(null);

  React.useEffect(() => {
    setView("mobile");
    setStatusOverride(null);
  }, [template?.id]);

  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
        <section
          role="dialog"
          aria-modal="true"
          aria-label="Template details"
          className="relative pointer-events-auto flex h-[min(90vh,48rem)] min-h-[min(90vh,36rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl focus:outline-none"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 flex size-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {(isLoading || !template) && (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-zinc-600">Loading template details...</p>
              </div>
            </div>
          )}

          {!isLoading && template && (
            <div className="grid flex-1 min-h-0 overflow-y-auto md:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)] md:overflow-hidden">
              {/* ── Left: Preview ── */}
              <div className="flex min-h-[28rem] flex-col items-center gap-4 border-b border-border bg-muted/30 p-5 md:min-h-0 md:border-r md:border-b-0 md:p-6">
                {/* Phone / Desktop preview */}
                <div className="flex flex-1 w-full items-center justify-center">
                  {view === "mobile" ? (
                    <PhoneMockup
                      thumbnail={template.mobileThumbnail}
                      className="w-full max-w-[220px]"
                      showOverlay={false}
                    />
                  ) : (
                    <div
                      className="relative w-full overflow-hidden rounded-lg ring-8 ring-zinc-800"
                      style={{ aspectRatio: "4 / 3" }}
                    >
                      {template.desktopThumbnail ? (
                        <img
                          src={template.desktopThumbnail}
                          alt={template.name}
                          className="h-full w-full object-cover"
                        />
                      ) : template.mobileThumbnail ? (
                        <img
                          src={template.mobileThumbnail}
                          alt={template.name}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                      <div className="pointer-events-none absolute -bottom-5 left-1/2 h-5 w-24 -translate-x-1/2 rounded-b bg-zinc-800" />
                    </div>
                  )}
                </div>

                {/* Mobile / Desktop toggle */}
                <div className="flex w-full gap-2">
                  <button
                    className={cn(
                      "flex h-10 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-[background-color,color,transform] active:scale-[0.98]",
                      view === "mobile"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-background text-foreground hover:bg-muted",
                    )}
                    onClick={() => setView("mobile")}
                  >
                    <Smartphone className="h-4 w-4" />
                    Mobile
                  </button>
                  <button
                    className={cn(
                      "flex h-10 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-[background-color,color,transform] active:scale-[0.98]",
                      view === "desktop"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-background text-foreground hover:bg-muted",
                    )}
                    onClick={() => setView("desktop")}
                  >
                    <Monitor className="h-4 w-4" />
                    Desktop
                  </button>
                </div>
              </div>

              {/* ── Right: Details ── */}
              <div className="flex min-h-0 flex-col gap-5 overflow-y-auto p-5 md:p-7">
                {/* Category badge */}
                <div>
                  <span className="inline-flex h-7 w-auto items-center justify-center rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground">
                    {getCategoryName(template.category) || "Template"}
                  </span>
                </div>

                <h2 className="text-2xl font-bold tracking-[-0.03em] text-foreground md:text-3xl">
                  {template.name}
                </h2>

                {/* Style chips / Tags */}
                <div className="flex flex-wrap gap-2">
                  {template.tags && template.tags.length > 0 ? (
                    template.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
                      >
                        {formatCategoryAndTagName(tag.name)}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                      {getCategoryName(template.category) || "Template"}
                    </span>
                  )}
                </div>

                {/* Rating */}
                {template.rating !== undefined && (
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-5 w-5",
                          i < (template.rating || 0)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-muted text-muted",
                        )}
                      />
                    ))}
                    <span className="text-sm text-muted-foreground">
                      ({template.reviewCount || 0})
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl font-bold tracking-[-0.03em] text-primary">
                    Rp{" "}
                    {template.priceAfterDiscount
                      ? parseInt(template.priceAfterDiscount).toLocaleString(
                          "id-ID",
                        )
                      : template.price
                        ? parseInt(template.price).toLocaleString("id-ID")
                        : "0"}
                  </span>
                  {template.price && template.priceAfterDiscount && (
                    <span className="relative text-base font-normal text-muted-foreground">
                      Rp {parseInt(template.price).toLocaleString("id-ID")}
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(to top left, transparent calc(50% - 1.5px), #df2225 50%, transparent calc(50% + 1.5px))",
                        }}
                      />
                    </span>
                  )}
                </div>

                {/* Description */}
                {template &&
                  (template.descriptionEn || template.descriptionIdn) && (
                    <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-muted/30 p-4 text-sm leading-relaxed text-foreground">
                      <div className="whitespace-pre-wrap space-y-2">
                        {(() => {
                          const desc =
                            template.descriptionEn || template.descriptionIdn;
                          if (typeof desc === "string") {
                            return desc.split("\n").map((line, i) => (
                              <p
                                key={i}
                                className={cn(
                                  "mb-2",
                                  line.startsWith("### ") &&
                                    "text-xs font-bold text-foreground mt-3",
                                  line.startsWith("**") && "font-semibold",
                                )}
                              >
                                {line.replace(/^### /, "").replace(/\*\*/g, "")}
                              </p>
                            ));
                          }
                          return <p>No description available</p>;
                        })()}
                      </div>
                    </div>
                  )}

                {/* CTA */}
                {(() => {
                  const status =
                    statusOverride ?? template.status?.toLowerCase();
                  const handleStatus = async (
                    next: "draft" | "active" | "inactive",
                  ) => {
                    if (next === "active" && status === "active") {
                      toast.info("Invitation already set to active");
                      onClose();
                      return;
                    }
                    setStatusUpdating(true);
                    try {
                      const cat = template.category;
                      await updateInvitationTemplate(template.id, {
                        name: template.name,
                        descriptionEn: template.descriptionEn,
                        descriptionIdn: template.descriptionIdn,
                        mobileThumbnail: (() => {
                          const u = template.mobileThumbnail;
                          if (!u) return undefined;
                          const m = u.match(/invitation-template\/.+/);
                          return m ? m[0] : u;
                        })(),
                        desktopThumbnail: (() => {
                          const u = template.desktopThumbnail;
                          if (!u) return undefined;
                          const m = u.match(/invitation-template\/.+/);
                          return m ? m[0] : u;
                        })(),
                        ...(cat
                          ? typeof cat === "string"
                            ? template.categoryId
                              ? { categoryId: template.categoryId }
                              : { newCategory: cat }
                            : { categoryId: cat.id }
                          : {}),
                        tagIds:
                          template.tags
                            ?.filter((t) => t.id !== null)
                            .map((t) => t.id) ?? [],
                        price: template.price,
                        priceAfterDiscount: template.priceAfterDiscount,
                        version: template.version,
                        template: template.template,
                        status: next,
                      });
                      setStatusOverride(next);
                      toast.success(
                        next === "active"
                          ? "Template activated successfully"
                          : next === "inactive"
                            ? "Template inactivated successfully"
                            : "Template updated successfully",
                      );
                      onStatusChange?.();
                    } catch {
                      toast.error("Could not update the template status");
                    } finally {
                      setStatusUpdating(false);
                    }
                  };
                  const editBtn = (
                    <button
                      className="h-11 flex-1 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition-[background-color,transform] hover:bg-muted active:scale-[0.98] disabled:opacity-60"
                      onClick={() =>
                        navigate(`/templates/edit?id=${template.id}`)
                      }
                      disabled={statusUpdating}
                    >
                      Edit Template
                    </button>
                  );
                  const activateBtn = (
                    <button
                      className="h-11 flex-1 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-[background-color,transform] hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => handleStatus("active")}
                      disabled={statusUpdating}
                    >
                      {statusUpdating ? "Updating..." : "Activate"}
                    </button>
                  );
                  return (
                    <div className="flex shrink-0 flex-col gap-2 border-t border-border pt-5 sm:flex-row">
                      {status !== "active" && activateBtn}
                      {editBtn}
                      {status !== "inactive" && (
                        <button
                          className="h-11 flex-1 rounded-lg border border-destructive/30 bg-destructive/10 px-4 text-sm font-semibold text-destructive transition-[background-color,transform] hover:bg-destructive/15 active:scale-[0.98] disabled:opacity-60"
                          onClick={() => handleStatus("inactive")}
                          disabled={statusUpdating}
                        >
                          {statusUpdating ? "Updating..." : "Mark inactive"}
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </section>
      </div>
    </>,
    document.body,
  );
}
