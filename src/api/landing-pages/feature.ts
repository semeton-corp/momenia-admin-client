import { apiClient } from "@/api/http-client";

export type FeatureResponseItem = {
    id: number;
    titleIdn: string;
    descriptionIdn: string;
    titleEn: string;
    descriptionEn: string;
    icon: string;
}

export type UpdateFeatureBatchItem = {
    id?: number;
    titleIdn: string;
    descriptionIdn: string;
    titleEn: string;
    descriptionEn: string;
    icon: string;
}

export type UpdateFeatureBatchPayload = UpdateFeatureBatchItem[];

export function getFeatures() {
    return apiClient.get<FeatureResponseItem[]>("/api/v1/landing-pages/features")
}

export function updateFeatureBatch(payload: UpdateFeatureBatchPayload) {
    return apiClient.put<FeatureResponseItem[]>(
        "/api/v1/landing-pages/features/batch",
        payload,
    );
}