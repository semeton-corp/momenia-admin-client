import { apiClient } from "@/api/http-client";

export type FaqResponseItem = {
  id: number;
  questionEn?: string | null;
  answerEn?: string | null;
  questionIdn?: string | null;
  answerIdn?: string | null;
};

export type UpdateFaqBatchItem = {
  id?: number;
  questionEn: string;
  answerEn: string;
  questionIdn: string;
  answerIdn: string;
};

export type UpdateFaqBatchPayload = UpdateFaqBatchItem[];

export function getFaqs() {
  return apiClient.get<FaqResponseItem[]>("/api/v1/landing-pages/faqs");
}

export function updateFaqsBatch(payload: UpdateFaqBatchPayload) {
  return apiClient.put<FaqResponseItem[]>(
    "/api/v1/landing-pages/faqs/batch",
    payload,
  );
}
