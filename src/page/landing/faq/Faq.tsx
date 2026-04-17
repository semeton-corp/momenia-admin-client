import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getFaqs,
  updateFaqsBatch,
  type FaqResponseItem,
} from "@/api/landing-pages/faqs";
import { queryKeys } from "@/api/query-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Locale = "english" | "indonesia";

type FaqItem = {
  clientId: number;
  id?: number;
  questionEn: string;
  answerEn: string;
  questionIdn: string;
  answerIdn: string;
  isOpen: boolean;
};

type FaqField = "questionEn" | "answerEn" | "questionIdn" | "answerIdn";

const languageLabels: Record<Locale, string> = {
  english: "English",
  indonesia: "Indonesia",
};

const locales: Locale[] = ["english", "indonesia"];

const faqFields: Record<Locale, { question: FaqField; answer: FaqField }> = {
  english: {
    question: "questionEn",
    answer: "answerEn",
  },
  indonesia: {
    question: "questionIdn",
    answer: "answerIdn",
  },
};

function normalizeFaqs(faqs: FaqResponseItem[]): FaqItem[] {
  return faqs.map((faq) => ({
    clientId: faq.id,
    id: faq.id,
    questionEn: faq.questionEn ?? "",
    answerEn: faq.answerEn ?? "",
    questionIdn: faq.questionIdn ?? "",
    answerIdn: faq.answerIdn ?? "",
    isOpen: false,
  }));
}

function buildFaqsPayload(faqs: FaqItem[]) {
  return faqs.map(({ id, questionEn, answerEn, questionIdn, answerIdn }) => ({
    ...(id === undefined ? {} : { id }),
    questionEn,
    answerEn,
    questionIdn,
    answerIdn,
  }));
}

function areFaqPayloadsEqual(
  firstFaqs: ReturnType<typeof buildFaqsPayload>,
  currentFaqs: ReturnType<typeof buildFaqsPayload>,
) {
  if (firstFaqs.length !== currentFaqs.length) {
    return false;
  }

  return firstFaqs.every((firstFaq, index) => {
    const currentFaq = currentFaqs[index];

    return (
      firstFaq.id === currentFaq.id &&
      firstFaq.questionEn === currentFaq.questionEn &&
      firstFaq.answerEn === currentFaq.answerEn &&
      firstFaq.questionIdn === currentFaq.questionIdn &&
      firstFaq.answerIdn === currentFaq.answerIdn
    );
  });
}

const Faq = () => {
  const queryClient = useQueryClient();
  const [draftFaqs, setDraftFaqs] = useState<FaqItem[] | null>(null);
  const {
    data: faqData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.faqs.lists(),
    queryFn: getFaqs,
  });
  const updateMutation = useMutation({
    mutationFn: updateFaqsBatch,
    onSuccess: (updatedFaqs) => {
      queryClient.setQueryData(queryKeys.faqs.lists(), updatedFaqs);
      setDraftFaqs(null);
    },
  });
  const apiFaqs = useMemo(() => normalizeFaqs(faqData ?? []), [faqData]);
  const faqs = draftFaqs ?? apiFaqs;
  const firstFaqs = useMemo(() => buildFaqsPayload(apiFaqs), [apiFaqs]);
  const currentFaqs = useMemo(() => buildFaqsPayload(faqs), [faqs]);
  const hasChanges = useMemo(
    () => !areFaqPayloadsEqual(firstFaqs, currentFaqs),
    [firstFaqs, currentFaqs],
  );

  const markChanged = (nextFaqs: FaqItem[]) => {
    setDraftFaqs(nextFaqs);
  };

  const toggleFaq = (clientId: number) => {
    markChanged(
      faqs.map((faq) =>
        faq.clientId === clientId ? { ...faq, isOpen: !faq.isOpen } : faq,
      ),
    );
  };

  const updateFaq = (clientId: number, field: FaqField, value: string) => {
    markChanged(
      faqs.map((faq) =>
        faq.clientId === clientId ? { ...faq, [field]: value } : faq,
      ),
    );
  };

  const addQuestion = () => {
    const nextClientId =
      Math.max(0, ...faqs.map((faq) => faq.clientId)) + 1;

    markChanged([
      ...faqs,
      {
        clientId: nextClientId,
        questionEn: "",
        answerEn: "",
        questionIdn: "",
        answerIdn: "",
        isOpen: true,
      },
    ]);
  };

  const removeQuestion = (clientId: number) => {
    markChanged(faqs.filter((faq) => faq.clientId !== clientId));
  };

  const applyChanges = () => {
    updateMutation.mutate(currentFaqs);
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background px-4 py-5 md:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-xl font-semibold tracking-normal">
          Frequently Ask Question
        </h1>

        <div className="flex flex-col gap-3 sm:items-end">
          <Button
            type="button"
            variant="secondary"
            className={cn(
              "h-11 min-w-48",
              hasChanges
                ? "bg-[#4f46e5] text-white hover:bg-[#4338ca]"
                : "bg-muted text-muted-foreground",
            )}
            disabled={!hasChanges || isLoading || updateMutation.isPending}
            onClick={applyChanges}
          >
            {updateMutation.isPending ? "Applying..." : "Apply changes"}
          </Button>
          <Button
            type="button"
            className="bg-[#4f46e5] text-white hover:bg-[#4338ca]"
            disabled={isLoading || updateMutation.isPending}
            onClick={addQuestion}
          >
            <Plus className="size-4" />
            Add Question
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground shadow-sm">
          Loading FAQs...
        </div>
      )}

      {isError && (
        <div className="mb-6 flex flex-col gap-3 rounded-lg border bg-card p-5 text-sm text-muted-foreground shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <span>Could not load FAQs from the API.</span>
          <Button type="button" variant="secondary" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {updateMutation.isError && (
        <div className="mb-6 rounded-lg border bg-card p-5 text-sm text-destructive shadow-sm">
          Could not apply FAQ changes.
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-2 xl:gap-10">
        {locales.map((locale) => (
          <section key={locale} className="space-y-6">
            <h2 className="text-base font-medium">{languageLabels[locale]}</h2>

            <div className="space-y-6">
              {!isLoading && faqs.length === 0 && (
                <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground shadow-sm">
                  No FAQs yet.
                </div>
              )}

              {faqs.map((faq) => (
                <FaqCard
                  key={faq.clientId}
                  faq={faq}
                  locale={locale}
                  onToggle={toggleFaq}
                  onUpdate={updateFaq}
                  onRemove={removeQuestion}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
};

type FaqCardProps = {
  faq: FaqItem;
  locale: Locale;
  onToggle: (clientId: number) => void;
  onUpdate: (clientId: number, field: FaqField, value: string) => void;
  onRemove: (clientId: number) => void;
};

const FaqCard = ({
  faq,
  locale,
  onToggle,
  onUpdate,
  onRemove,
}: FaqCardProps) => {
  const fields = faqFields[locale];
  const question = faq[fields.question];
  const answer = faq[fields.answer];

  return (
    <article className="rounded-lg border bg-card p-5 shadow-sm">
      <button
        type="button"
        className={cn(
          "flex w-full items-start justify-between gap-4 text-left",
          faq.isOpen && "mb-5",
        )}
        aria-expanded={faq.isOpen}
        onClick={() => onToggle(faq.clientId)}
      >
        {faq.isOpen ? (
          <span className="text-sm font-medium">Question</span>
        ) : (
          <span className="space-y-2">
            <span className="block text-xl font-semibold leading-tight">
              {question || "Untitled question"}
            </span>
            <span className="block max-w-xl text-sm leading-6 text-muted-foreground">
              {answer || "Add an answer for this question."}
            </span>
          </span>
        )}

        {faq.isOpen ? (
          <ChevronUp className="mt-1 size-4 shrink-0" />
        ) : (
          <ChevronDown className="mt-1 size-4 shrink-0" />
        )}
      </button>

      {faq.isOpen && (
        <div className="space-y-4">
          <Input
            value={question}
            placeholder="Type the feature title (Max 5 words)"
            onChange={(event) =>
              onUpdate(faq.clientId, fields.question, event.target.value)
            }
          />

          <div className="space-y-2">
            <Label htmlFor={`${locale}-${faq.clientId}-answer`}>Answer</Label>
            <textarea
              id={`${locale}-${faq.clientId}-answer`}
              value={answer}
              placeholder="Type the feature description (Max 50 words)"
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-20 w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px]"
              onChange={(event) =>
                onUpdate(faq.clientId, fields.answer, event.target.value)
              }
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="destructive"
              onClick={() => onRemove(faq.clientId)}
            >
              Remove Question
            </Button>
          </div>
        </div>
      )}
    </article>
  );
};

export default Faq;
