import { useState } from "react";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Locale = "english" | "indonesia";

type FaqItem = {
  id: number;
  question_en: string;
  answer_en: string;
  question_idn: string;
  answer_idn: string;
  isOpen: boolean;
};

type FaqField = "question_en" | "answer_en" | "question_idn" | "answer_idn";

const initialFaqs: FaqItem[] = [
  {
    id: 1,
    question_en: "how memoria works?",
    answer_en: "it works by create beautiful invitation for you",
    question_idn: "bagaimana cara kerja memoria?",
    answer_idn: "dengan membuat undangan yang indah",
    isOpen: false,
  },
  {
    id: 2,
    question_en: "how memoria works?",
    answer_en: "it works by create beautiful invitation for you",
    question_idn: "bagaimana cara kerja memoria?",
    answer_idn: "dengan membuat undangan yang indah",
    isOpen: false,
  },
];

const languageLabels: Record<Locale, string> = {
  english: "English",
  indonesia: "Indonesia",
};

const locales: Locale[] = ["english", "indonesia"];

const faqFields: Record<Locale, { question: FaqField; answer: FaqField }> = {
  english: {
    question: "question_en",
    answer: "answer_en",
  },
  indonesia: {
    question: "question_idn",
    answer: "answer_idn",
  },
};

const Faq = () => {
  const [faqs, setFaqs] = useState<FaqItem[]>(initialFaqs);
  const [hasChanges, setHasChanges] = useState(false);

  const markChanged = (nextFaqs: FaqItem[]) => {
    setFaqs(nextFaqs);
    setHasChanges(true);
  };

  const toggleFaq = (id: number) => {
    markChanged(
      faqs.map((faq) =>
        faq.id === id ? { ...faq, isOpen: !faq.isOpen } : faq,
      ),
    );
  };

  const updateFaq = (id: number, field: FaqField, value: string) => {
    markChanged(
      faqs.map((faq) => (faq.id === id ? { ...faq, [field]: value } : faq)),
    );
  };

  const addQuestion = () => {
    const faqIds = faqs.map((faq) => faq.id);
    const nextId = Math.max(0, ...faqIds) + 1;

    markChanged([
      ...faqs,
      {
        id: nextId,
        question_en: "",
        answer_en: "",
        question_idn: "",
        answer_idn: "",
        isOpen: true,
      },
    ]);
  };

  const removeQuestion = (id: number) => {
    markChanged(faqs.filter((faq) => faq.id !== id));
  };

  const applyChanges = () => {
    setHasChanges(false);
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
            className="h-11 min-w-48 bg-muted text-muted-foreground"
            disabled={!hasChanges}
            onClick={applyChanges}
          >
            Apply changes
          </Button>
          <Button
            type="button"
            className="bg-[#4f46e5] text-white hover:bg-[#4338ca]"
            onClick={addQuestion}
          >
            <Plus className="size-4" />
            Add Question
          </Button>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-2 xl:gap-10">
        {locales.map((locale) => (
          <section key={locale} className="space-y-6">
            <h2 className="text-base font-medium">{languageLabels[locale]}</h2>

            <div className="space-y-6">
              {faqs.map((faq) => (
                <FaqCard
                  key={faq.id}
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
  onToggle: (id: number) => void;
  onUpdate: (id: number, field: FaqField, value: string) => void;
  onRemove: (id: number) => void;
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
        onClick={() => onToggle(faq.id)}
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
              onUpdate(faq.id, fields.question, event.target.value)
            }
          />

          <div className="space-y-2">
            <Label htmlFor={`${locale}-${faq.id}-answer`}>Answer</Label>
            <textarea
              id={`${locale}-${faq.id}-answer`}
              value={answer}
              placeholder="Type the feature description (Max 50 words)"
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-20 w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px]"
              onChange={(event) =>
                onUpdate(faq.id, fields.answer, event.target.value)
              }
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="destructive"
              onClick={() => onRemove(faq.id)}
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
