import { apiClient } from "@/api/http-client";

export type TestimonialResponseItem = {
  id: number;
  name?: string | null;
  rating?: number | null;
  testimonialIdn?: string | null;
  testimonialEn?: string | null;
  profileImage?: string | null;
};

export type UpdateTestimonialsBatchItem = {
  id?: number;
  name: string;
  rating: number;
  testimonialIdn: string;
  testimonialEn: string;
  profileImage?: string;
};

export type UpdateTestimonialsBatchPayload = UpdateTestimonialsBatchItem[];

export function getTestimonials() {
  return apiClient.get<TestimonialResponseItem[]>(
    "/api/v1/landing-pages/testimonials",
  );
}

export function updateTestimonialsBatch(
  payload: UpdateTestimonialsBatchPayload,
) {
  return apiClient.put<TestimonialResponseItem[]>(
    "/api/v1/landing-pages/testimonials/batch",
    payload,
  );
}
