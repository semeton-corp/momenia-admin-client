import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FeatureCard } from "@/components/ui/features/feature-card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import { getFeatures, updateFeatureBatch } from "@/api/landing-pages/feature";
import { uploadObjectWithPresignedUrl } from "@/api/objects";
import { extractImageKey } from "@/utils/extractImageKey";
import LoadingScreen from "@/components/ui/loading-screen";
import type { Feature } from "@/types/feature";

type Locale = "english" | "indonesia";


type FeatureField = "titleIdn" | "descriptionIdn" | "titleEn" | "descriptionEn";

type ApiFeature = Partial<Omit<Feature, "isOpen" | "iconPreview">>;

const locales: Locale[] = ["english", "indonesia"];

const languageLabels: Record<Locale, string> = {
  english: "English",
  indonesia: "Indonesia",
};

function normalizeFeatures(data: ApiFeature[]): Feature[] {
  return data.map((item) => ({
    id: item.id,
    titleIdn: item.titleIdn ?? "",
    descriptionIdn: item.descriptionIdn ?? "",
    titleEn: item.titleEn ?? "",
    descriptionEn: item.descriptionEn ?? "",
    icon: item.icon ?? "",
    isOpen: false,
  }));
}

function buildFeaturesPayload(features: Feature[]) {
  return features.map(
    ({ id, titleIdn, descriptionIdn, titleEn, descriptionEn, icon }) => ({
      ...(id !== undefined ? { id } : {}),
      titleIdn,
      descriptionIdn,
      titleEn,
      descriptionEn,
      icon: extractImageKey(icon || ""),
    }),
  );
}

function areFeaturesEqual(
  first: ReturnType<typeof buildFeaturesPayload>,
  current: ReturnType<typeof buildFeaturesPayload>,
) {
  if (first.length !== current.length) return false;

  return first.every((item, index) => {
    const currentItem = current[index];

    return (
      item.id === currentItem.id &&
      item.titleIdn === currentItem.titleIdn &&
      item.descriptionIdn === currentItem.descriptionIdn &&
      item.titleEn === currentItem.titleEn &&
      item.descriptionEn === currentItem.descriptionEn &&
      item.icon === currentItem.icon
    );
  });
}

const Features = () => {
  const queryClient = useQueryClient();
  const {
    data: featuresData,
    isLoading,
  } = useQuery({
    queryKey: queryKeys.features.lists(),
    queryFn: getFeatures,
  });
  const [draftFeatures, setDraftFeatures] = useState<Feature[] | null>(null);
  const apiFeatures = normalizeFeatures(featuresData ?? []);
  const features = draftFeatures ?? apiFeatures;
  const firstFeatures = useMemo(
    () => buildFeaturesPayload(apiFeatures),
    [apiFeatures],
  );
  const currentFeatures = useMemo(
    () => buildFeaturesPayload(features),
    [features],
  );
  const hasChanges = useMemo(
    () => !areFeaturesEqual(firstFeatures, currentFeatures),
    [firstFeatures, currentFeatures],
  );

  const [showErrors, setShowErrors] = useState(false);


  const updateMutation = useMutation({
    mutationFn: updateFeatureBatch,
    onSuccess: (updatedFeatures) => {
      queryClient.setQueryData(queryKeys.features.lists(), updatedFeatures);
      setDraftFeatures(null);
    },
  })

  const markChanged = (nextFeatures: Feature[]) => {
    setDraftFeatures(nextFeatures);
  };

  const toggleFeature = (index: number) => {
    markChanged(
      features.map((f, i) =>
        i === index ? { ...f, isOpen: !f.isOpen } : f
      )
    );
  };

  const updateFeature = (index: number, field: FeatureField, value: string) => {
    markChanged(
      features.map((f, i) =>
        i === index ? { ...f, [field]: value } : f
      )
    );
  };

  const updateIcon = (
    index: number,
    iconPreview: string,
    file: File,
  ) => {
    markChanged(
      features.map((f, i) =>
        i === index ? { ...f, iconPreview } : f
      ),
    );

    uploadObjectWithPresignedUrl(file, "landing-page")
      .then((uploaded) => {
        const fullUrl = `https://is3.cloudhost.id/${uploaded.key}`;

        setDraftFeatures((current) =>
          (current ?? features).map((f, i) =>
            i === index ? { ...f, icon: fullUrl, iconPreview } : f,
          ),
        );
      })
      .catch(() => {
        setDraftFeatures((current) =>
          (current ?? features).map((f, i) =>
            i === index ? { ...f, icon: "", iconPreview: undefined } : f,
          ),
        );
      });
  };

  const addFeature = () => {
    markChanged([
      ...features,
      {
        titleIdn: "",
        descriptionIdn: "",
        titleEn: "",
        descriptionEn: "",
        icon: "",
        isOpen: true,
      },
    ]);
  };

  const removeFeature = (index: number) => {
    markChanged(features.filter((_, i) => i !== index));
  };

  const applyChanges = () => {
    const hasEmptyDescription = features.some(
      (f) =>
        !f.titleIdn.trim() ||
        !f.titleEn.trim() ||
        !f.descriptionIdn.trim() ||
        !f.descriptionEn.trim(),
    );
    if (hasEmptyDescription) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    updateMutation.mutate(currentFeatures);
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] px-4 py-6 md:px-6 lg:px-7">
      {(isLoading || updateMutation.isPending) && <LoadingScreen />}
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.03em] text-foreground">Features</h1>
            <p className="mt-1 text-sm text-muted-foreground">Edit the feature cards shown on the public landing page in both languages.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              className="min-w-44"
              disabled={
                !hasChanges ||
                isLoading ||
                updateMutation.isPending
              }
              onClick={applyChanges}
            >
              Apply changes
            </Button>
            <Button type="button" onClick={addFeature}>
              <Plus className="size-4" />
              Add feature
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2 xl:gap-7">
          {locales.map((locale) => (
            <section key={locale} className="space-y-4">
              <div className="flex items-end justify-between border-b border-border/70 pb-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Copy deck</p>
                  <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em]">{languageLabels[locale]}</h2>
                </div>
                <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                  {features.length} items
                </span>
              </div>

              <div className="space-y-4">
                {features.map((feature, index) => (
                  <FeatureCard
                    key={feature.id ?? `new-${index}`}
                    feature={feature}
                    locale={locale}
                    index={index}
                    showError={showErrors}
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
      </div>
    </main>
  );
};

export default Features;
