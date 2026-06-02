import { apiClient } from "@/api/http-client"

export type LandingPageCatalog = {
  id: number
  invitationTemplateId: string
  invitationTemplateNameIdn: string
  invitationTemplateNameEn: string
  invitationTemplateMobileThumbnail: string
  isNew: boolean
}

export type CatalogBatchItem = {
  id?: number
  invitationTemplateId: string
  isNew: boolean
}

export function getLandingPageCatalogs() {
  return apiClient.get<LandingPageCatalog[]>("/api/v1/landing-pages/catalogs")
}

export function saveLandingPageCatalogsBatch(items: CatalogBatchItem[]) {
  return apiClient.put<LandingPageCatalog[]>("/api/v1/landing-pages/catalogs/batch", items)
}
