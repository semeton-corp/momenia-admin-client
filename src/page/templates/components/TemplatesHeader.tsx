import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function TemplatesHeader() {
  const navigate = useNavigate();

  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-bold tracking-[-0.03em] text-foreground">
            Templates
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Review, activate, and refine the invitations available to customers.
        </p>
      </div>
      <Button type="button" onClick={() => navigate("/templates/add")}>
        <Plus className="size-4" />
        New template
      </Button>
    </div>
  );
}
