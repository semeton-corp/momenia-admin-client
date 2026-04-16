import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, Grid2X2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Locale = "english" | "indonesia";

type Feature = {
  id: number;
  titleIdn: string;
  descriptionIdn: string;
  titleEn: string;
  descriptionEn: string;
  icon: string;
  isOpen: boolean;
};

type FeatureField = "titleIdn" | "descriptionIdn" | "titleEn" | "descriptionEn";

const initialFeatures: Feature[] = [
  {
    id: 3,
    titleIdn: "feature indonesia",
    descriptionIdn: "description indonesia",
    titleEn: "feature english",
    descriptionEn: "description english",
    icon: "https://is3.cloudhost.id/memoria/landing-page/lp_7070a7f4-bd41-4935-8dc7-63e24cab16de",
    isOpen: false,
  },
  {
    id: 4,
    titleIdn: "feature indonesia",
    descriptionIdn: "description indonesia",
    titleEn: "feature english",
    descriptionEn: "description english",
    icon: "https://is3.cloudhost.id/memoria/landing-page/lp_7070a7f4-bd41-4935-8dc7-63e24cab16de",
    isOpen: false,
  },
  {
    id: 5,
    titleIdn: "feature indonesia",
    descriptionIdn: "description indonesia",
    titleEn: "feature english",
    descriptionEn: "description english",
    icon: "https://is3.cloudhost.id/memoria/landing-page/lp_378dbb87-3322-4603-80c4-c7d9f0564ebc?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Checksum-Mode=ENABLED&X-Amz-Credential=J5ZANI2LWJK5EKUXBCQ6%2F20260413%2Fap-southeast-3%2Fs3%2Faws4_request&X-Amz-Date=20260413T081458Z&X-Amz-Expires=900&X-Amz-SignedHeaders=host&x-id=GetObject&X-Amz-Signature=01e57f8cc4e95f3bd61613d776f1d001bc5966c57c73f7f0c920c3019442743d",
    isOpen: true,
  },
  {
    id: 6,
    titleIdn: "feature indonesia",
    descriptionIdn: "description indonesia",
    titleEn: "feature english",
    descriptionEn: "description english",
    icon: "https://is3.cloudhost.id/memoria/landing-page/lp_7070a7f4-bd41-4935-8dc7-63e24cab16de",
    isOpen: true,
  },
];

const locales: Locale[] = ["english", "indonesia"];

const languageLabels: Record<Locale, string> = {
  english: "English",
  indonesia: "Indonesia",
};

const featureFields: Record<
  Locale,
  { title: FeatureField; description: FeatureField }
> = {
  english: {
    title: "titleEn",
    description: "descriptionEn",
  },
  indonesia: {
    title: "titleIdn",
    description: "descriptionIdn",
  },
};

const Features = () => {
  const [features, setFeatures] = useState<Feature[]>(initialFeatures);
  const [hasChanges, setHasChanges] = useState(false);

  const markChanged = (nextFeatures: Feature[]) => {
    setFeatures(nextFeatures);
    setHasChanges(true);
  };

  const toggleFeature = (id: number) => {
    markChanged(
      features.map((feature) =>
        feature.id === id ? { ...feature, isOpen: !feature.isOpen } : feature,
      ),
    );
  };

  const updateFeature = (id: number, field: FeatureField, value: string) => {
    markChanged(
      features.map((feature) =>
        feature.id === id ? { ...feature, [field]: value } : feature,
      ),
    );
  };

  const updateIcon = (id: number, icon: string) => {
    markChanged(
      features.map((feature) =>
        feature.id === id ? { ...feature, icon } : feature,
      ),
    );
  };

  const addFeature = () => {
    const nextId = Math.max(0, ...features.map((feature) => feature.id)) + 1;

    markChanged([
      ...features,
      {
        id: nextId,
        titleIdn: "",
        descriptionIdn: "",
        titleEn: "",
        descriptionEn: "",
        icon: "",
        isOpen: true,
      },
    ]);
  };

  const removeFeature = (id: number) => {
    markChanged(features.filter((feature) => feature.id !== id));
  };

  const applyChanges = () => {
    setHasChanges(false);
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background px-4 py-5 md:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-xl font-semibold tracking-normal">Features</h1>

        <div className="flex flex-col gap-3 sm:items-end">
          <Button
            type="button"
            className="h-11 min-w-56 bg-[#4f46e5] text-white hover:bg-[#4338ca]"
            disabled={!hasChanges}
            onClick={applyChanges}
          >
            Apply changes
          </Button>
          <Button
            type="button"
            className="bg-[#4f46e5] text-white hover:bg-[#4338ca]"
            onClick={addFeature}
          >
            <Plus className="size-4" />
            Add Feature
          </Button>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-2 xl:gap-10">
        {locales.map((locale) => (
          <section key={locale} className="space-y-6">
            <h2 className="text-base font-medium">{languageLabels[locale]}</h2>

            <div className="space-y-6">
              {features.map((feature) => (
                <FeatureCard
                  key={feature.id}
                  feature={feature}
                  locale={locale}
                  onToggle={toggleFeature}
                  onUpdate={updateFeature}
                  onUpdateIcon={updateIcon}
                  onRemove={removeFeature}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
};

type FeatureCardProps = {
  feature: Feature;
  locale: Locale;
  onToggle: (id: number) => void;
  onUpdate: (id: number, field: FeatureField, value: string) => void;
  onUpdateIcon: (id: number, icon: string) => void;
  onRemove: (id: number) => void;
};

const FeatureCard = ({
  feature,
  locale,
  onToggle,
  onUpdate,
  onUpdateIcon,
  onRemove,
}: FeatureCardProps) => {
  const iconInputRef = useRef<HTMLInputElement>(null);
  const fields = featureFields[locale];
  const title = feature[fields.title];
  const description = feature[fields.description];

  const handleIconChange = (file: File | undefined) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onUpdateIcon(feature.id, reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <article className="rounded-lg border bg-card p-5 shadow-sm">
      <button
        type="button"
        className={cn(
          "flex w-full items-start justify-between gap-4 text-left",
          feature.isOpen && "mb-5",
        )}
        aria-expanded={feature.isOpen}
        onClick={() => onToggle(feature.id)}
      >
        {feature.isOpen ? (
          <span className="text-sm font-medium">Image Icon</span>
        ) : (
          <span className="flex min-w-0 gap-5">
            <FeatureIcon feature={feature} />
            <span className="min-w-0 space-y-2">
              <span className="block text-xl font-semibold leading-tight">
                {title || "Untitled feature"}
              </span>
              <span className="block max-w-xl text-sm leading-6 text-muted-foreground">
                {description || "Add a description for this feature."}
              </span>
            </span>
          </span>
        )}

        {feature.isOpen ? (
          <ChevronUp className="mt-1 size-4 shrink-0" />
        ) : (
          <ChevronDown className="mt-1 size-4 shrink-0" />
        )}
      </button>

      {feature.isOpen && (
        <div className="grid gap-5 sm:grid-cols-[4rem_1fr]">
          <div className="space-y-3">
            <button
              type="button"
              className="flex size-16 items-center justify-center rounded-full bg-muted text-[#4f46e5]"
              onClick={() => iconInputRef.current?.click()}
              aria-label="Choose feature icon"
            >
              {feature.icon ? (
                <FeatureIcon feature={feature} />
              ) : (
                <Plus className="size-5" />
              )}
            </button>
            <input
              ref={iconInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleIconChange(event.target.files?.[0])}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`${locale}-${feature.id}-title`}>
                Feature Title
              </Label>
              <Input
                id={`${locale}-${feature.id}-title`}
                value={title}
                placeholder="Type the feature title (Max 5 words)"
                onChange={(event) =>
                  onUpdate(feature.id, fields.title, event.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${locale}-${feature.id}-description`}>
                Feature Description
              </Label>
              <textarea
                id={`${locale}-${feature.id}-description`}
                value={description}
                placeholder="Type the feature description (Max 50 words)"
                className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-20 w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px]"
                onChange={(event) =>
                  onUpdate(feature.id, fields.description, event.target.value)
                }
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="destructive"
                onClick={() => onRemove(feature.id)}
              >
                Remove Feature
              </Button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

const FeatureIcon = ({ feature }: { feature: Feature }) => {
  return (
    <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eef2ff] text-[#4f46e5]">
      {feature.icon ? (
        <img
          src={feature.icon}
          alt=""
          className="size-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <Grid2X2 className="size-5" />
      )}
    </span>
  );
};

export default Features;
