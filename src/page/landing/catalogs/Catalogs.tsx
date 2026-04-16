import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Catalog = {
  id: number;
  catalogPreview: string;
  title: string;
  templateId: string;
};

const initialCatalogs: Catalog[] = [
  {
    id: 1,
    catalogPreview:
      "https://is3.cloudhost.id/memoria/landing-page/lp_84560ed4-f041-42b2-80a1-8694c0e4a085",
    title: "wedding invitation",
    templateId: "",
  },
];

const Catalogs = () => {
  const [newTemplates, setNewTemplates] = useState<Catalog[]>(initialCatalogs);
  const [memoriaChoices, setMemoriaChoices] =
    useState<Catalog[]>(initialCatalogs);
  const [selectedCatalogId, setSelectedCatalogId] = useState<number | null>(
    initialCatalogs[0]?.id ?? null,
  );
  const [editingCatalogId, setEditingCatalogId] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const selectedCatalog = useMemo(() => {
    return (
      newTemplates.find((catalog) => catalog.id === selectedCatalogId) ??
      memoriaChoices.find((catalog) => catalog.id === selectedCatalogId) ??
      null
    );
  }, [memoriaChoices, newTemplates, selectedCatalogId]);

  const editSelectedTemplate = () => {
    if (!selectedCatalog) return;
    setEditingCatalogId(selectedCatalog.id);
  };

  const updateCatalog = (id: number, field: keyof Catalog, value: string) => {
    const updateItem = (catalog: Catalog) =>
      catalog.id === id ? { ...catalog, [field]: value } : catalog;

    setNewTemplates((templates) => templates.map(updateItem));
    setMemoriaChoices((templates) => templates.map(updateItem));
    setHasChanges(true);
  };

  const applyChanges = () => {
    setEditingCatalogId(null);
    setHasChanges(false);
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background px-4 py-5 md:px-6">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-xl font-semibold tracking-normal">
          Catalog Momemia
        </h1>

        <div className="flex flex-col gap-5 sm:items-end">
          <Button
            type="button"
            variant="secondary"
            className="h-11 min-w-48 bg-muted text-muted-foreground"
            disabled={!hasChanges}
            onClick={applyChanges}
          >
            Apply changes
          </Button>
          <Button
            type="button"
            className="bg-[#4f46e5] text-white hover:bg-[#4338ca]"
            disabled={!selectedCatalog}
            onClick={editSelectedTemplate}
          >
            Edit Selected Template
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        <CatalogSection
          title="New Template"
          catalogs={newTemplates}
          selectedCatalogId={selectedCatalogId}
          onSelect={setSelectedCatalogId}
        />

        {editingCatalogId && selectedCatalog && (
          <CatalogEditor catalog={selectedCatalog} onUpdate={updateCatalog} />
        )}

        <CatalogSection
          title="Momenia's Choise's"
          catalogs={memoriaChoices}
          selectedCatalogId={selectedCatalogId}
          onSelect={setSelectedCatalogId}
          action={
            <Button
              type="button"
              className="bg-[#4f46e5] text-white hover:bg-[#4338ca]"
              disabled={!selectedCatalog}
              onClick={editSelectedTemplate}
            >
              Edit Selected Template
            </Button>
          }
        />
      </div>
    </main>
  );
};

type CatalogSectionProps = {
  title: string;
  catalogs: Catalog[];
  selectedCatalogId: number | null;
  onSelect: (id: number) => void;
  action?: ReactNode;
};

const CatalogSection = ({
  title,
  catalogs,
  selectedCatalogId,
  onSelect,
  action,
}: CatalogSectionProps) => {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-medium">{title}</h2>
        {action}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {catalogs.map((catalog) => (
          <CatalogCard
            key={catalog.id}
            catalog={catalog}
            isSelected={catalog.id === selectedCatalogId}
            onSelect={() => onSelect(catalog.id)}
          />
        ))}
      </div>
    </section>
  );
};

type CatalogCardProps = {
  catalog: Catalog;
  isSelected: boolean;
  onSelect: () => void;
};

const CatalogCard = ({ catalog, isSelected, onSelect }: CatalogCardProps) => {
  return (
    <button
      type="button"
      className={cn(
        "rounded-lg border bg-card p-3 text-left shadow-sm transition",
        "hover:border-[#4f46e5]/70 focus-visible:border-[#4f46e5] focus-visible:ring-[#4f46e5]/30 focus-visible:ring-[3px] focus-visible:outline-none",
        isSelected && "border-[#0ea5e9] ring-2 ring-[#0ea5e9]",
      )}
      onClick={onSelect}
    >
      <div className="flex justify-center rounded-md bg-background px-3 pt-3">
        <div className="w-full max-w-44 overflow-hidden rounded-md">
          <img
            src={catalog.catalogPreview}
            alt={catalog.title}
            className="aspect-[3/4.6] w-full object-cover"
          />
        </div>
      </div>

      <div className="px-2 py-3 text-center">
        <h3 className="text-base font-semibold">
          {catalog.title || "Untitled catalog"}
        </h3>
      </div>
    </button>
  );
};

type CatalogEditorProps = {
  catalog: Catalog;
  onUpdate: (id: number, field: keyof Catalog, value: string) => void;
};

const CatalogEditor = ({ catalog, onUpdate }: CatalogEditorProps) => {
  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="grid gap-5 lg:grid-cols-[14rem_1fr]">
        <div className="rounded-md bg-background p-3">
          <img
            src={catalog.catalogPreview}
            alt={catalog.title}
            className="aspect-[3/4.6] w-full rounded-md object-cover"
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`catalog-${catalog.id}-title`}>Title</Label>
            <Input
              id={`catalog-${catalog.id}-title`}
              value={catalog.title}
              placeholder="Type the catalog title"
              onChange={(event) =>
                onUpdate(catalog.id, "title", event.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`catalog-${catalog.id}-template`}>
              Template ID
            </Label>
            <Input
              id={`catalog-${catalog.id}-template`}
              value={catalog.templateId}
              placeholder="Select or enter template ID"
              onChange={(event) =>
                onUpdate(catalog.id, "templateId", event.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`catalog-${catalog.id}-preview`}>
              Catalog Preview
            </Label>
            <Input
              id={`catalog-${catalog.id}-preview`}
              value={catalog.catalogPreview}
              placeholder="Paste catalog preview URL"
              onChange={(event) =>
                onUpdate(catalog.id, "catalogPreview", event.target.value)
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Catalogs;
