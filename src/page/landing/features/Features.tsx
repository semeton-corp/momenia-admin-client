import { useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Grid2X2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
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

const locales: Locale[] = ["english", "indonesia"];

const languageLabels: Record<Locale, string> = {
  english: "English",
  indonesia: "Indonesia",
};

function normalizeFeatures(data: any[]): Feature[] {
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
    isError,
    refetch,
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

  const [uploadingIds, setUploadingIds] = useState<number[]>([]);
  const [uploadError, setUploadError] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const isUploading = uploadingIds.length > 0;


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

  const updateFeature = (index: number, field: FeatureField, value: any) => {
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
    setUploadError(false);
    setUploadingIds((ids) => [...ids, index]);

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
            i === index
              ? {
                ...f,
                icon: fullUrl,
                iconPreview,
              }
              : f,
          ),
        );
      })
      .catch(() => {
        setUploadError(true);

        setDraftFeatures((current) =>
          (current ?? features).map((f, i) =>
            i === index
              ? {
                ...f,
                icon: "",
                iconPreview: undefined,
              }
              : f,
          ),
        );
      })
      .finally(() => {
        setUploadingIds((ids) => ids.filter((x) => x !== index));
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
    <main className="min-h-[calc(100vh-4rem)] bg-background px-4 py-5 md:px-6">
      {(isLoading || updateMutation.isPending) && <LoadingScreen />}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-xl font-semibold tracking-normal">Features</h1>

        <div className="flex flex-col gap-3 sm:items-end">
          <Button
            type="button"
            className="h-11 min-w-56 bg-[#4f46e5] text-white hover:bg-[#4338ca]"
            disabled={
              !hasChanges ||
              isLoading ||
              updateMutation.isPending
            }
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
    </main>
  );
};

export default Features;
