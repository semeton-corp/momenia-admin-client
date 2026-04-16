import { useRef, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Star } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Locale = "english" | "indonesia";

type Testimonial = {
  id: number;
  name: string;
  testimonialIdn: string;
  testimonialEn: string;
  rating: number;
  profileImage: string;
  isOpen: boolean;
};

type TestimonialField = "name" | "testimonialIdn" | "testimonialEn";

const initialTestimonials: Testimonial[] = [
  {
    id: 1,
    name: "indra v.2",
    testimonialIdn: "testimonial indonesia",
    testimonialEn: "testimonial english",
    rating: 4.6,
    profileImage: "",
    isOpen: false,
  },
];

const locales: Locale[] = ["english", "indonesia"];

const languageLabels: Record<Locale, string> = {
  english: "English",
  indonesia: "Indonesia",
};

const testimonialFields: Record<Locale, "testimonialEn" | "testimonialIdn"> = {
  english: "testimonialEn",
  indonesia: "testimonialIdn",
};

const Testimonials = () => {
  const [testimonials, setTestimonials] =
    useState<Testimonial[]>(initialTestimonials);
  const [hasChanges, setHasChanges] = useState(false);

  const markChanged = (nextTestimonials: Testimonial[]) => {
    setTestimonials(nextTestimonials);
    setHasChanges(true);
  };

  const toggleReview = (id: number) => {
    markChanged(
      testimonials.map((testimonial) =>
        testimonial.id === id
          ? { ...testimonial, isOpen: !testimonial.isOpen }
          : testimonial,
      ),
    );
  };

  const updateReview = (
    id: number,
    field: TestimonialField,
    value: string,
  ) => {
    markChanged(
      testimonials.map((testimonial) =>
        testimonial.id === id ? { ...testimonial, [field]: value } : testimonial,
      ),
    );
  };

  const updateRating = (id: number, rating: number) => {
    markChanged(
      testimonials.map((testimonial) =>
        testimonial.id === id ? { ...testimonial, rating } : testimonial,
      ),
    );
  };

  const updateImage = (id: number, profileImage: string) => {
    markChanged(
      testimonials.map((testimonial) =>
        testimonial.id === id
          ? { ...testimonial, profileImage }
          : testimonial,
      ),
    );
  };

  const addReview = () => {
    const nextId = Math.max(0, ...testimonials.map((item) => item.id)) + 1;

    markChanged([
      ...testimonials,
      {
        id: nextId,
        name: "",
        testimonialIdn: "",
        testimonialEn: "",
        rating: 0,
        profileImage: "",
        isOpen: true,
      },
    ]);
  };

  const removeReview = (id: number) => {
    markChanged(testimonials.filter((testimonial) => testimonial.id !== id));
  };

  const applyChanges = () => {
    setHasChanges(false);
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background px-4 py-5 md:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-xl font-semibold tracking-normal">Reviews</h1>

        <div className="flex flex-col gap-3 sm:items-end">
          <Button
            type="button"
            variant="secondary"
            className="h-11 min-w-44 bg-muted text-muted-foreground"
            disabled={!hasChanges}
            onClick={applyChanges}
          >
            Apply changes
          </Button>
          <Button
            type="button"
            className="bg-[#4f46e5] text-white hover:bg-[#4338ca]"
            onClick={addReview}
          >
            <Plus className="size-4" />
            Add Review
          </Button>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-2 xl:gap-10">
        {locales.map((locale) => (
          <section key={locale} className="space-y-6">
            <h2 className="text-base font-medium">{languageLabels[locale]}</h2>

            <div className="space-y-6">
              {testimonials.map((testimonial) => (
                <ReviewCard
                  key={testimonial.id}
                  locale={locale}
                  testimonial={testimonial}
                  onToggle={toggleReview}
                  onUpdate={updateReview}
                  onUpdateRating={updateRating}
                  onUpdateImage={updateImage}
                  onRemove={removeReview}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
};

type ReviewCardProps = {
  locale: Locale;
  testimonial: Testimonial;
  onToggle: (id: number) => void;
  onUpdate: (id: number, field: TestimonialField, value: string) => void;
  onUpdateRating: (id: number, rating: number) => void;
  onUpdateImage: (id: number, profileImage: string) => void;
  onRemove: (id: number) => void;
};

const ReviewCard = ({
  locale,
  testimonial,
  onToggle,
  onUpdate,
  onUpdateRating,
  onUpdateImage,
  onRemove,
}: ReviewCardProps) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const testimonialField = testimonialFields[locale];
  const testimonialText = testimonial[testimonialField];

  const handleImageChange = (file: File | undefined) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onUpdateImage(testimonial.id, reader.result);
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
          testimonial.isOpen && "mb-5",
        )}
        aria-expanded={testimonial.isOpen}
        onClick={() => onToggle(testimonial.id)}
      >
        {testimonial.isOpen ? (
          <span className="text-sm font-medium">User Image</span>
        ) : (
          <span className="flex min-w-0 gap-4">
            <ProfileImage testimonial={testimonial} />
            <span className="min-w-0 space-y-2">
              <span className="block text-xl font-semibold leading-tight">
                {testimonial.name || "Untitled review"}
              </span>
              <RatingStars rating={testimonial.rating} readonly />
              <span className="block max-w-lg text-sm leading-6 text-muted-foreground">
                {testimonialText || "Add testimonial copy for this review."}
              </span>
            </span>
          </span>
        )}

        {testimonial.isOpen ? (
          <ChevronUp className="mt-1 size-4 shrink-0" />
        ) : (
          <ChevronDown className="mt-1 size-4 shrink-0" />
        )}
      </button>

      {testimonial.isOpen && (
        <div className="grid gap-5 sm:grid-cols-[3.75rem_1fr]">
          <div className="space-y-3">
            <button
              type="button"
              className="flex size-13 items-center justify-center rounded-full bg-muted text-[#4f46e5]"
              onClick={() => imageInputRef.current?.click()}
              aria-label="Choose profile image"
            >
              {testimonial.profileImage ? (
                <ProfileImage testimonial={testimonial} />
              ) : (
                <Plus className="size-5" />
              )}
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleImageChange(event.target.files?.[0])}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <RatingStars
                rating={testimonial.rating}
                onChange={(rating) => onUpdateRating(testimonial.id, rating)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${locale}-${testimonial.id}-name`}>Name</Label>
              <Input
                id={`${locale}-${testimonial.id}-name`}
                value={testimonial.name}
                placeholder="Type the user name"
                onChange={(event) =>
                  onUpdate(testimonial.id, "name", event.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${locale}-${testimonial.id}-testimonial`}>
                Testimonial
              </Label>
              <textarea
                id={`${locale}-${testimonial.id}-testimonial`}
                value={testimonialText}
                placeholder="Type the feature description (Max 50 words)"
                className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-20 w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px]"
                onChange={(event) =>
                  onUpdate(testimonial.id, testimonialField, event.target.value)
                }
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="destructive"
                onClick={() => onRemove(testimonial.id)}
              >
                Remove Review
              </Button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

const ProfileImage = ({ testimonial }: { testimonial: Testimonial }) => {
  const fallback = testimonial.name.trim().slice(0, 2).toUpperCase() || "RV";

  return (
    <Avatar className="size-13">
      <AvatarImage src={testimonial.profileImage} alt={testimonial.name} />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
};

type RatingStarsProps = {
  rating: number;
  readonly?: boolean;
  onChange?: (rating: number) => void;
};

const RatingStars = ({ rating, readonly, onChange }: RatingStarsProps) => {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, index) => {
        const value = index + 1;
        const isActive = rating >= value - 0.5;

        if (readonly) {
          return (
            <Star
              key={value}
              className={cn(
                "size-4",
                isActive
                  ? "fill-[#f59e0b] text-[#f59e0b]"
                  : "fill-muted text-muted",
              )}
            />
          );
        }

        return (
          <button
            key={value}
            type="button"
            className="rounded-md p-0.5"
            onClick={() => onChange?.(value)}
            aria-label={`Set rating to ${value}`}
          >
            <Star
              className={cn(
                "size-4",
                isActive
                  ? "fill-[#f59e0b] text-[#f59e0b]"
                  : "fill-muted text-muted",
              )}
            />
          </button>
        );
      })}
    </div>
  );
};

export default Testimonials;
