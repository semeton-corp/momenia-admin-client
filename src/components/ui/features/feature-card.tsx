import { useRef } from "react";
import { ChevronDown, ChevronUp, Grid2X2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import type { Feature, FeatureField, Locale } from "@/types/feature";

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

type FeatureCardProps = {
    feature: Feature;
    locale: Locale;
    index: number;
    showError?: boolean;
    onToggle: (id: number) => void;
    onUpdate: (id: number, field: FeatureField, value: string) => void;
    onUpdateIcon: (id: number, preview: string, file: File) => void;
    onRemove: (id: number) => void;
};

export const FeatureCard = ({
    feature,
    locale,
    index,
    showError = false,
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
                onUpdateIcon(index, reader.result, file);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <article className="group overflow-hidden rounded-lg border border-border/80 bg-card p-5 transition-colors hover:border-primary/35">
            <button
                type="button"
                className={cn(
                    "flex w-full items-start justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    feature.isOpen && "mb-5",
                )}
                aria-expanded={feature.isOpen}
                onClick={() => onToggle(index)}
            >
                {feature.isOpen ? (
                    <span className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Image icon</span>
                ) : (
                    <span className="flex min-w-0 gap-4 pr-2">
                        <FeatureIcon feature={feature} />
                        <span className="min-w-0 space-y-1.5">
                            <span className="block text-lg font-bold leading-tight tracking-[-0.03em]">
                                {title || "Untitled feature"}
                            </span>
                            <span className="block max-w-2xl text-sm leading-6 text-muted-foreground">
                                {description || "Add a description for this feature."}
                            </span>
                        </span>
                    </span>
                )}

                {feature.isOpen ? (
                    <ChevronUp className="mt-1 size-4 shrink-0 text-muted-foreground" />
                ) : (
                    <ChevronDown className="mt-1 size-4 shrink-0 text-muted-foreground" />
                )}
            </button>

            {feature.isOpen && (
                <div className="grid gap-5 sm:grid-cols-[4rem_1fr]">
                    <div className="space-y-3">
                        <button
                            type="button"
                            className="flex size-16 items-center justify-center rounded-2xl border border-border bg-muted text-primary transition-colors hover:bg-accent"
                            onClick={() => iconInputRef.current?.click()}
                            aria-label="Choose feature icon"
                        >
                            {feature.iconPreview || feature.icon ? (
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
                                Feature title <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id={`${locale}-${feature.id}-title`}
                                value={title}
                                placeholder="Type the feature title"
                                className={cn(
                                    showError && !title.trim() && "border-destructive focus-visible:ring-destructive/50",
                                )}
                                onChange={(event) =>
                                    onUpdate(index, fields.title, event.target.value)
                                }
                            />
                            {showError && !title.trim() && (
                                <p className="text-destructive text-xs">Title is required.</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor={`${locale}-${feature.id}-description`}>
                                Feature description <span className="text-destructive">*</span>
                            </Label>
                            <textarea
                                id={`${locale}-${feature.id}-description`}
                                value={description}
                                placeholder="Type the feature description"
                                className={cn(
                                    "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full resize-none rounded-lg border bg-card/80 px-3 py-2 text-sm outline-none transition-[color,box-shadow] focus-visible:ring-[3px]",
                                    showError && !description.trim() && "border-destructive focus-visible:ring-destructive/50",
                                )}
                                onChange={(event) =>
                                    onUpdate(index, fields.description, event.target.value)
                                }
                            />
                            {showError && !description.trim() && (
                                <p className="text-destructive text-xs">Description is required.</p>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => onRemove(index)}
                            >
                                Remove feature
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
        <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-accent text-primary">
            {feature.iconPreview ?? feature.icon ? (
                <img src={feature.iconPreview ?? feature.icon} className="size-full object-cover" />
            ) : (
                <Grid2X2 />
            )}
        </span>
    );
};
