import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import {
  getInvitationTemplates,
  getInvitationTemplateDetail,
  type InvitationTemplate,
} from "@/api/cms/invitation-templates";
import { queryKeys } from "@/api/query-keys";
import { Button } from "@/components/ui/button";
import {
  TemplatesHeader,
  TemplatesFilters,
  TemplateCard,
  TemplateDetailModal,
} from "./components";

export default function Templates() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedStatuses, setSelectedStatuses] = useState<
    ("draft" | "active" | "inactive")[]
  >(["draft", "active"]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  const queryParams = {
    keyword: keyword || undefined,
    sortField,
    sortOrder,
    pageSize: 50,
    statuses: selectedStatuses,
  };

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.invitationTemplates.lists(queryParams),
    queryFn: () => getInvitationTemplates(queryParams),
  });

  const { data: selectedTemplate, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ["invitationTemplate", selectedTemplateId],
    queryFn: () => getInvitationTemplateDetail(selectedTemplateId!),
    enabled: !!selectedTemplateId,
    staleTime: 0,
    gcTime: 0,
  });

  const templates = response?.data ?? [];

  const handleCardClick = (template: InvitationTemplate) => {
    setSelectedTemplateId(template.id);
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] px-4 py-6 md:px-6 lg:px-7">
      <div className="mx-auto max-w-[1800px]">
        <TemplatesHeader />

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

        {/* States */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-3 animate-pulse"
              >
                <div className="flex justify-center">
                  <div className="aspect-[9/18] w-32 rounded-3xl bg-muted" />
                </div>
                <div className="space-y-2 pb-1">
                  <div className="h-3 bg-muted rounded mx-auto w-3/4" />
                  <div className="h-3 bg-muted rounded mx-auto w-1/2" />
                  <div className="mt-2 h-4 w-16 mx-auto rounded-full bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
            <p className="text-sm text-muted-foreground">
              Failed to load templates.
            </p>
            <Button type="button" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="size-4" />
              Try again
            </Button>
          </div>
        )}

        {!isLoading && !isError && templates.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
            <p className="text-sm text-muted-foreground">No templates found.</p>
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              onClick={() => navigate("/templates/add")}
            >
              Add your first template
            </Button>
          </div>
        )}

        {!isLoading && !isError && templates.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onClick={() => handleCardClick(template)}
              />
            ))}
          </div>
        )}

        <TemplateDetailModal
          open={!!selectedTemplateId}
          template={selectedTemplate ?? null}
          onClose={() => setSelectedTemplateId(null)}
          isLoading={isLoadingTemplate}
          onStatusChange={() =>
            queryClient.invalidateQueries({
              queryKey: queryKeys.invitationTemplates.all,
            })
          }
        />
      </div>
    </main>
  );
}
