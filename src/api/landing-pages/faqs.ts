import { apiClient } from "@/api/http-client";

export type FaqResponseItem = {
  id: number;
  questionEn?: string | null;
  answerEn?: string | null;
  questionIdn?: string | null;
  answerIdn?: string | null;
};

export type UpdateFaqPayload = {
  questionEn: string;
  answerEn: string;
  questionIdn: string;
  answerIdn: string;
};

export function getFaqs() {
  return apiClient.get<FaqResponseItem[]>("/api/v1/landing-pages/faqs");
}

export function updateFaq(id: number, payload: UpdateFaqPayload) {
  return apiClient.put<FaqResponseItem>(`/api/v1/landing-pages/faqs/${id}`, payload);
}
